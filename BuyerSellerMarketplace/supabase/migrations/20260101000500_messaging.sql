-- Messaging: the conversation a mutual match creates, and the reports queue.
--
-- A conversation exists only because a seller accepted an interest. There is no
-- other way to create one, and no policy that lets a member insert into this
-- table directly — that is the whole of the trust model, expressed as a schema.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- One conversation per accepted match. The unique constraint is what makes
  -- respond_to_match() idempotent under a double-click.
  match_id uuid not null unique references public.matches (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  created_at timestamptz not null default now()
);

create index conversations_buyer_idx on public.conversations (buyer_id);
create index conversations_seller_idx on public.conversations (seller_id);
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

alter table public.conversations enable row level security;

create policy "participants read their conversations"
  on public.conversations for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "admins read all conversations"
  on public.conversations for select
  to authenticated
  using (public.is_admin());

-- No INSERT policy at all: respond_to_match() is the only writer.
-- No UPDATE policy either: the read markers move through
-- mark_conversation_read(), which knows which side the caller is on.

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
    -- A block stops the thread from both ends, without deleting it: the
    -- history stays readable, and neither side can add to it.
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

-- A message is never edited or deleted. The other person already read it, and
-- a thread that can be rewritten after the fact is not a record of anything.

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

-- ---------------------------------------------------------------------------
-- the seller's answer
-- ---------------------------------------------------------------------------

/**
 * Accept or decline an interest.
 *
 * Accepting is two writes — the match status and the conversation row — so it
 * happens here, in one transaction. A client doing both would occasionally
 * leave a buyer told they matched with nowhere to talk.
 *
 * Returns the conversation id on an accept, null on a decline.
 */
create or replace function public.respond_to_match(p_match_id uuid, p_accept boolean)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_match public.matches;
  v_seller uuid;
  v_conversation uuid;
begin
  select * into v_match from public.matches where id = p_match_id;
  if not found then
    raise exception 'match not found';
  end if;

  select owner_id into v_seller from public.listings where id = v_match.listing_id;

  -- The seller decides. An administrator cannot accept on their behalf: an
  -- accepted match is a consent, and consent is not an administrative action.
  if v_seller is distinct from auth.uid() then
    raise exception 'only the listing owner may answer this';
  end if;

  if v_match.status <> 'pending' then
    raise exception 'this has already been answered';
  end if;

  update public.matches
     set status = case when p_accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = p_match_id;

  if not p_accept then
    return null;
  end if;

  insert into public.conversations (match_id, buyer_id, seller_id, listing_id)
  values (p_match_id, v_match.buyer_id, v_seller, v_match.listing_id)
  on conflict (match_id) do nothing
  returning id into v_conversation;

  if v_conversation is null then
    select id into v_conversation from public.conversations where match_id = p_match_id;
  end if;

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
