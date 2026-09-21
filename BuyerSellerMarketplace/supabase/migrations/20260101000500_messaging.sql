-- Messaging: a shopper's enquiry about a listing, and the reports queue.
--
-- The rule, and the only thing here that needs defending: **a conversation is
-- started by the buyer, never by the seller.** A shopper can ask a question
-- about anything on sale — that is what a shop is for — but a seller cannot
-- open a thread with somebody who has not spoken to them first.
--
-- That asymmetry is what stops the member list becoming a mailing list. It is
-- enforced as an INSERT policy requiring `buyer_id = auth.uid()`, not as a rule
-- in the client, because the client is the part an interested party would
-- skip.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  -- Denormalised from the listing so the participant check is one read rather
  -- than a join, and so a conversation survives with a readable history if the
  -- listing is later deleted... which it does not, because the cascade above
  -- takes it. Kept anyway: the policies are simpler for it, and the day
  -- somebody softens that cascade this column is already right.
  seller_id uuid not null references public.profiles (id) on delete cascade,

  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  created_at timestamptz not null default now(),

  -- One thread per shopper per listing. A second question about the same item
  -- belongs in the thread where the first answer is.
  unique (listing_id, buyer_id),
  -- A seller enquiring about their own listing is a bug, not a use case.
  check (buyer_id <> seller_id)
);

create index conversations_buyer_idx on public.conversations (buyer_id, created_at desc);
create index conversations_seller_idx on public.conversations (seller_id, created_at desc);
create index conversations_listing_idx on public.conversations (listing_id);

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  );
$$;

/**
 * Keep `seller_id` honest.
 *
 * The buyer inserts the row, so they supply both ids, and nothing in an INSERT
 * policy can check that the one they claim is the seller actually owns the
 * listing. Without this, a shopper could open a "conversation" naming any
 * account as the seller and message a stranger through it — which is exactly
 * the thing the buyer-initiates rule is supposed to prevent.
 *
 * So the column is overwritten from the listing rather than trusted, and a
 * listing that is not on sale cannot be enquired about at all.
 */
create or replace function public.set_conversation_seller()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_status text;
begin
  select owner_id, status into v_owner, v_status
  from public.listings where id = new.listing_id;

  if v_owner is null then
    raise exception 'listing not found';
  end if;

  if v_status <> 'published' then
    raise exception 'that listing is not on sale';
  end if;

  if public.is_blocked_between(new.buyer_id, v_owner) then
    raise exception 'you cannot contact this seller';
  end if;

  new.seller_id := v_owner;
  return new;
end;
$$;

create trigger conversations_set_seller
  before insert on public.conversations
  for each row execute function public.set_conversation_seller();

alter table public.conversations enable row level security;

create policy "participants read their conversations"
  on public.conversations for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "admins read all conversations"
  on public.conversations for select
  to authenticated
  using (public.is_admin());

-- The asymmetry, in one policy. A member may only ever create a conversation
-- with themselves as the buyer; the trigger above fills in who the seller is.
create policy "buyers open a conversation about a listing"
  on public.conversations for insert
  to authenticated
  with check (buyer_id = auth.uid() and public.is_member());

-- No UPDATE policy: the read markers move through mark_conversation_read(),
-- which knows which side the caller is on.

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "participants read their messages"
  on public.messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

create policy "participants send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
    -- A block stops the thread from both ends without deleting it: the history
    -- stays readable, and neither side can add to it.
    and not exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.is_blocked_between(c.buyer_id, c.seller_id)
    )
  );

create policy "admins read messages"
  on public.messages for select
  to authenticated
  using (public.is_admin());

-- A message is never edited or deleted. The other person has already read it,
-- and a thread that can be rewritten afterwards is not a record of anything.

/**
 * Mark everything up to now as read.
 *
 * A function rather than an update policy because the column depends on which
 * side the caller is on, and working that out in the client would mean the
 * client deciding something the database already knows.
 */
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.conversations
     set buyer_last_read_at = case when buyer_id = auth.uid() then now() else buyer_last_read_at end,
         seller_last_read_at = case when seller_id = auth.uid() then now() else seller_last_read_at end
   where id = p_conversation_id
     and (buyer_id = auth.uid() or seller_id = auth.uid());
end;
$$;

/**
 * Start an enquiry, or return the thread that already exists.
 *
 * Two writes — the conversation and its first message — so it happens here, in
 * one transaction. A client doing both would occasionally leave a seller with
 * an empty thread and no idea what was being asked.
 *
 * Idempotent on `(listing_id, buyer_id)`: asking a second question reuses the
 * thread the first answer is in rather than starting a parallel one.
 */
create or replace function public.start_enquiry(p_listing_id uuid, p_body text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_conversation uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  if coalesce(btrim(p_body), '') = '' then
    raise exception 'say something to the seller';
  end if;

  select id into v_conversation
  from public.conversations
  where listing_id = p_listing_id and buyer_id = auth.uid();

  if v_conversation is null then
    -- seller_id is set by the trigger, which also refuses an unpublished
    -- listing and a blocked pair. Passing auth.uid() here is a placeholder the
    -- trigger overwrites.
    insert into public.conversations (listing_id, buyer_id, seller_id)
    values (p_listing_id, auth.uid(), auth.uid())
    returning id into v_conversation;
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (v_conversation, auth.uid(), btrim(p_body));

  return v_conversation;
end;
$$;

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  subject_profile_id uuid references public.profiles (id) on delete cascade,
  subject_listing_id uuid references public.listings (id) on delete cascade,
  reason text not null check (reason in (
    'spam', 'harassment', 'misleading', 'impersonation', 'off_platform_payment', 'other'
  )),
  detail text check (char_length(detail) <= 4000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  -- A report is about something. Both columns null is a row nobody can action.
  check (subject_profile_id is not null or subject_listing_id is not null)
);

create index reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;

create policy "members read their own reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

create policy "members file reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid() and public.is_member());

create policy "admins read all reports"
  on public.reports for select
  to authenticated
  using (public.is_admin());

create policy "admins resolve reports"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (true);

-- The subject of a report is never told who filed it, and never told it exists.
-- That is the absence of a policy rather than a rule written anywhere: nothing
-- above grants the reported party a read.
