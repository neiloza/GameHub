-- Notifications: the in-app record, the preferences, and the delivery outbox.
--
-- Two rules this file encodes:
--
--   * Preferences gate *email and push*, never the notification center. An
--     in-app notification always lands: it is the record of what happened, and
--     suppressing it would leave a member unable to find out they matched.
--   * Delivery is somebody else's job. A row in `notification_deliveries` is a
--     claim ticket; the `notification-dispatch` edge function picks it up and
--     hands it to whatever mail or push provider is configured. Nothing in this
--     file talks to a vendor, and with none configured the platform still works
--     — members just see the in-app center instead of also getting mail.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- Free text rather than an enum: rows written by an older build must still
  -- render after the vocabulary moves on, and `describeNotification` in the
  -- client has a default branch for exactly that.
  kind text not null check (char_length(kind) between 1 and 60),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_profile_idx on public.notifications (profile_id, created_at desc);
create index notifications_unread_idx
  on public.notifications (profile_id)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "members read their own notifications"
  on public.notifications for select
  to authenticated
  using (profile_id = auth.uid());

create policy "members mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- No INSERT policy: notify_profile() writes them. A member who could insert
-- here could write themselves a "membership active" notice, and more to the
-- point could write one to somebody else.

-- Realtime: the bell subscribes to this table.
alter publication supabase_realtime add table public.notifications;

/**
 * Which preference category a kind belongs to.
 *
 * The database owns this mapping because two callers need it —
 * claim_notification_delivery() here and the settings page in the client — and
 * they must never disagree about whether somebody opted out.
 * `packages/shared/src/lib/notifications.ts` mirrors it, with a test asserting
 * every kind is covered.
 *
 * An unknown kind falls to `account`, never `marketing`: the failure mode of
 * the first is a notice somebody did not need, and of the second is marketing
 * to somebody who opted out.
 */
create or replace function public.notification_category(p_kind text)
returns text
language sql immutable
as $$
  select case p_kind
    when 'enquiry_received'           then 'activity'
    when 'message_received'           then 'messages'
    when 'application_reviewed'       then 'account'
    when 'application_info_requested' then 'account'
    when 'membership_started'         then 'account'
    when 'membership_trouble'         then 'account'
    when 'referral_qualified'         then 'account'
    when 'payout_sent'                then 'account'
    when 'listing_suspended'          then 'account'
    when 'identity_verified'          then 'account'
    when 'system_announcement'        then 'marketing'
    else 'account'
  end;
$$;

-- ---------------------------------------------------------------------------
-- preferences
-- ---------------------------------------------------------------------------

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,

  email_activity boolean not null default true,
  email_messages boolean not null default true,
  email_account boolean not null default true,
  -- The one that defaults off. Everything else here is about the member's own
  -- account; this one is about us.
  email_marketing boolean not null default false,

  -- Only two categories are ever pushed. An account notice at 3am is not worth
  -- a phone buzzing, and there is no column here to turn one on.
  push_activity boolean not null default true,
  push_messages boolean not null default true,

  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

create policy "members manage their own notification preferences"
  on public.notification_preferences for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- the outbox
-- ---------------------------------------------------------------------------

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email', 'push')),
  claimed_at timestamptz,
  delivered_at timestamptz,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  unique (notification_id, channel)
);

create index notification_deliveries_pending_idx
  on public.notification_deliveries (created_at)
  where delivered_at is null;

alter table public.notification_deliveries enable row level security;

create policy "admins read deliveries"
  on public.notification_deliveries for select
  to authenticated
  using (public.is_admin());

-- No member-facing policy: whether an email left our building is operational
-- detail, and a member who wants to know reads their inbox.

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- Unique on the token, not on (profile, token): one device can be handed from
  -- one person to another, and the newest owner wins. Without this, a
  -- notification would follow the handset rather than the account.
  token text not null unique check (char_length(token) between 1 and 500),
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now()
);

create index push_tokens_profile_idx on public.push_tokens (profile_id);

alter table public.push_tokens enable row level security;

create policy "members manage their own push tokens"
  on public.push_tokens for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- writing a notification
-- ---------------------------------------------------------------------------

/**
 * The single writer.
 *
 * Writes the in-app row unconditionally, then a delivery row per channel the
 * member has left switched on. Preferences gate delivery, never the record.
 *
 * Security definer, and called only from triggers and the service role — there
 * is no grant that lets a member call it, because a member who could would be
 * able to write a notification to anybody.
 */
create or replace function public.notify_profile(
  p_profile_id uuid,
  p_kind text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_category text := public.notification_category(p_kind);
  v_prefs public.notification_preferences;
  v_email boolean;
  v_push boolean;
begin
  insert into public.notifications (profile_id, kind, payload)
  values (p_profile_id, p_kind, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;

  select * into v_prefs from public.notification_preferences where profile_id = p_profile_id;

  -- No row yet means the table's own defaults apply. Spelled out rather than
  -- inserting a row here, because writing a preferences row as a side effect of
  -- someone else's action is how you end up with defaults frozen at whatever
  -- they were the day the member's first notification happened to arrive.
  -- Computed into locals first: PL/pgSQL's IF parser reads up to the first
  -- THEN token, so a CASE expression written inline in the condition is a
  -- syntax error rather than a clever one-liner.
  v_email := case v_category
    when 'activity'  then coalesce(v_prefs.email_activity, true)
    when 'messages'  then coalesce(v_prefs.email_messages, true)
    when 'account'   then coalesce(v_prefs.email_account, true)
    when 'marketing' then coalesce(v_prefs.email_marketing, false)
    else false
  end;

  -- Only two categories are ever pushed, and only to a device we have a token
  -- for: a delivery row nothing can send is an outbox that never empties.
  v_push := case v_category
    when 'activity' then coalesce(v_prefs.push_activity, true)
    when 'messages' then coalesce(v_prefs.push_messages, true)
    else false
  end and exists (select 1 from public.push_tokens where profile_id = p_profile_id);

  if v_email then
    insert into public.notification_deliveries (notification_id, channel)
    values (v_id, 'email')
    on conflict do nothing;
  end if;

  if v_push then
    insert into public.notification_deliveries (notification_id, channel)
    values (v_id, 'push')
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

-- Revoked from members and re-granted to the service role only: the edge
-- functions call this, and nobody with a browser session can.
revoke execute on function public.notify_profile(uuid, text, jsonb) from public, authenticated, anon;
grant execute on function public.notify_profile(uuid, text, jsonb) to service_role;

/**
 * Claim a delivery for sending.
 *
 * The `claimed_at is null` in the WHERE clause plus `for update skip locked` is
 * what makes two dispatch workers safe to run at once: each claims a disjoint
 * set, and a row already claimed is skipped rather than waited on.
 */
create or replace function public.claim_notification_delivery(p_limit int default 20)
returns setof public.notification_deliveries
language plpgsql security definer
set search_path = public
as $$
begin
  return query
  update public.notification_deliveries d
     set claimed_at = now(), attempts = d.attempts + 1
   where d.id in (
     select id from public.notification_deliveries
      where delivered_at is null
        and claimed_at is null
        and attempts < 5
      order by created_at
      limit greatest(0, least(p_limit, 100))
      for update skip locked
   )
  returning d.*;
end;
$$;

revoke execute on function public.claim_notification_delivery(int)
  from public, authenticated, anon;
grant execute on function public.claim_notification_delivery(int) to service_role;

-- ---------------------------------------------------------------------------
-- the events that notify
-- ---------------------------------------------------------------------------

/**
 * A new enquiry tells the seller somebody is asking about their listing.
 *
 * On the conversation rather than on the message, so a seller gets one "you
 * have an enquiry" notice and then ordinary message notices — rather than the
 * same event announced twice because start_enquiry() writes both rows.
 */
create or replace function public.notify_on_new_enquiry()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_listing public.listings;
  v_buyer_name text;
begin
  select * into v_listing from public.listings where id = new.listing_id;
  select display_name into v_buyer_name from public.profiles where id = new.buyer_id;

  perform public.notify_profile(
    new.seller_id,
    'enquiry_received',
    jsonb_build_object(
      'listing_id', v_listing.id,
      'listing_name', v_listing.name,
      'conversation_id', new.id,
      'buyer_name', v_buyer_name
    )
  );
  return new;
end;
$$;

create trigger conversations_notify_seller
  after insert on public.conversations
  for each row execute function public.notify_on_new_enquiry();

/**
 * Every message after the first tells the other side.
 *
 * The first message *is* the enquiry, and the conversation trigger has already
 * told the seller about it — so that one is skipped here rather than buzzing
 * the same phone twice for one event.
 */
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_conversation public.conversations;
  v_recipient uuid;
  v_side text;
  v_sender_name text;
begin
  select * into v_conversation from public.conversations where id = new.conversation_id;

  -- The opening message of a thread. `notify_on_new_enquiry` has already told
  -- the seller, so notifying again here would buzz one phone twice for one
  -- event.
  --
  -- "Is there an *earlier* message?" rather than "is this the only message?":
  -- an AFTER ROW trigger can see every row its own statement inserted, so a
  -- multi-row INSERT would make the only-message test false for the very row it
  -- is meant to catch. Ordering by (created_at, id) is stable when two rows
  -- share a timestamp, which they do inside one statement.
  if new.sender_id = v_conversation.buyer_id
     and not exists (
       select 1 from public.messages m
       where m.conversation_id = new.conversation_id
         and (m.created_at, m.id) < (new.created_at, new.id)
     ) then
    return new;
  end if;

  if v_conversation.buyer_id = new.sender_id then
    v_recipient := v_conversation.seller_id;
    v_side := 'seller';
  else
    v_recipient := v_conversation.buyer_id;
    v_side := 'buyer';
  end if;

  select display_name into v_sender_name from public.profiles where id = new.sender_id;

  perform public.notify_profile(
    v_recipient,
    'message_received',
    jsonb_build_object(
      'conversation_id', v_conversation.id,
      'listing_id', v_conversation.listing_id,
      -- Which route to send them to. The two sides read the same thread at
      -- different URLs: a buyer at /messages/:id, a seller at
      -- /listings/:listing/enquiries/:id.
      'recipient_side', v_side,
      'sender_name', v_sender_name
    )
  );
  return new;
end;
$$;

create trigger messages_notify_recipient
  after insert on public.messages
  for each row execute function public.notify_on_new_message();

create or replace function public.notify_on_application_reviewed()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_kind text := replace(tg_table_name, '_applications', '');
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status in ('approved', 'rejected') then
    perform public.notify_profile(
      new.profile_id,
      'application_reviewed',
      jsonb_build_object('role', v_kind, 'status', new.status)
    );
  elsif new.status = 'info_requested' then
    perform public.notify_profile(
      new.profile_id,
      'application_info_requested',
      jsonb_build_object('role', v_kind)
    );
  end if;

  return new;
end;
$$;

create trigger seller_applications_notify
  after update on public.seller_applications
  for each row execute function public.notify_on_application_reviewed();
create trigger advertiser_applications_notify
  after update on public.advertiser_applications
  for each row execute function public.notify_on_application_reviewed();
create trigger promoter_applications_notify
  after update on public.promoter_applications
  for each row execute function public.notify_on_application_reviewed();

create or replace function public.notify_on_listing_suspended()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status = 'suspended' and old.status is distinct from 'suspended' then
    perform public.notify_profile(
      new.owner_id,
      'listing_suspended',
      jsonb_build_object('listing_id', new.id, 'listing_name', new.name)
    );
  end if;
  return new;
end;
$$;

create trigger listings_notify_suspension
  after update on public.listings
  for each row execute function public.notify_on_listing_suspended();

create or replace function public.notify_on_referral_qualified()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status = 'qualified' and old.status is distinct from 'qualified' then
    perform public.notify_profile(
      new.referrer_id,
      'referral_qualified',
      jsonb_build_object('fee_cents', new.fee_cents)
    );
  elsif new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.notify_profile(
      new.referrer_id,
      'payout_sent',
      jsonb_build_object('amount_cents', new.fee_cents)
    );
  end if;
  return new;
end;
$$;

create trigger referrals_notify
  after update on public.referrals
  for each row execute function public.notify_on_referral_qualified();
