-- Membership and billing.
--
-- The payment processor is the source of truth for whether somebody is paying.
-- This schema records what the processor told us and when, and nothing here
-- ever decides on its own that a membership has started: the webhook does that,
-- against an event we log first, so a replayed delivery cannot act twice.

create table public.memberships (
  profile_id uuid primary key references public.profiles (id) on delete cascade,

  plan text not null default 'none' check (plan in (
    'none', 'intro_monthly', 'intro_annual', 'standard_monthly', 'standard_annual'
  )),
  -- A *state*, not a plan. `trialing` being a state is what lets a trial be
  -- switched on later without revisiting every gate that already asks
  -- "is this membership active?".
  state text not null default 'none' check (state in (
    'none', 'trialing', 'active', 'past_due', 'canceled'
  )),

  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  processor_customer_id text,
  processor_subscription_id text,

  -- CRM mirror. Nullable throughout: the platform works with no CRM configured,
  -- and these columns are how the admin reconciliation view tells "never
  -- synced" from "synced and then broke".
  crm_synced_at timestamptz,
  crm_sync_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index memberships_subscription_idx
  on public.memberships (processor_subscription_id)
  where processor_subscription_id is not null;

create trigger memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

alter table public.memberships enable row level security;

create policy "members read their own membership"
  on public.memberships for select
  to authenticated
  using (profile_id = auth.uid());

create policy "admins read all memberships"
  on public.memberships for select
  to authenticated
  using (public.is_admin());

-- No INSERT or UPDATE policy for anybody, administrators included. Every write
-- comes from the billing webhook over the service role. An administrator who
-- could hand out a membership by editing a row would be creating a paid
-- account the processor has never heard of, and the next webhook would undo it.

/**
 * Is this account paying right now?
 *
 * Mirrors `isMembershipActive` in packages/shared/src/lib/membership.ts. Both
 * exist because the question is asked in two places — a policy here and a gate
 * in the UI — and only this one is binding.
 *
 * `trialing` is deliberately absent: trials are switched off in this starter,
 * and a stray trialing row from a restored backup or a processor test should
 * not grant access. Add it here and in `TRIAL_ENABLED` together.
 */
create or replace function public.has_active_membership(p_profile_id uuid default null)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.profile_id = coalesce(p_profile_id, auth.uid())
      and m.state = 'active'
      and (m.current_period_end is null or m.current_period_end > now())
  );
$$;

/**
 * How many introductory seats are left.
 *
 * Readable by anyone, including a signed-out visitor: a cohort running out is
 * the whole point of it, and a number nobody can see creates none of the
 * urgency the pricing is built on. Counts memberships that ever *held* an
 * intro plan, so a member who cancels does not free their seat for somebody
 * else — the rate was theirs.
 */
create or replace function public.intro_seats_remaining()
returns int
language sql stable security definer
set search_path = public
as $$
  select greatest(0, 400 - (
    select count(*)::int from public.memberships m
    where m.plan in ('intro_monthly', 'intro_annual')
  ));
$$;

grant execute on function public.intro_seats_remaining() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- the listing cap
-- ---------------------------------------------------------------------------

/**
 * The one entitlement enforced in the database as well as the UI.
 *
 * Every other gate is a client-side courtesy — hiding a button nobody can use
 * anyway, because the underlying rows are protected by their own policies. This
 * one is different: without it, a non-member could POST straight to `listings`
 * and hold as many as they liked.
 *
 * FREE_LISTINGS in constants.ts is 0. Raising it means changing the 0 below in
 * the same commit — the two must agree, and this one is binding.
 */
create or replace function public.enforce_listing_limit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_count int;
  v_allowed int;
begin
  -- Seeds and edge functions run as the service role and are not capped.
  if auth.uid() is null then
    return new;
  end if;

  select count(*) into v_count from public.listings where owner_id = new.owner_id;

  v_allowed := case when public.has_active_membership(new.owner_id) then 10 else 0 end;

  if v_count >= v_allowed then
    if v_allowed = 0 then
      raise exception 'a membership is required to publish a listing'
        using errcode = 'check_violation';
    else
      raise exception 'listing limit reached (%)', v_allowed
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger listings_enforce_limit
  before insert on public.listings
  for each row execute function public.enforce_listing_limit();

-- ---------------------------------------------------------------------------
-- the processor event log
-- ---------------------------------------------------------------------------

/**
 * Every processor event we have seen.
 *
 * The unique index on `event_id` is the idempotency guarantee. Payment
 * processors replay webhooks by design — on a timeout, on a retry, on a manual
 * resend from their dashboard — and the difference between "we recorded this
 * event" and "we acted on this event" is the difference between paying a
 * referral once and paying it four times.
 *
 * The flow is: insert (claiming the event), act, then set `processed_at`. A row
 * with an `error` and no `processed_at` is a webhook that failed and is the
 * first thing to look at when somebody says they paid.
 */
create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  kind text not null,
  profile_id uuid references public.profiles (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index billing_events_created_idx on public.billing_events (created_at desc);
create index billing_events_unprocessed_idx
  on public.billing_events (created_at)
  where processed_at is null;

alter table public.billing_events enable row level security;

create policy "admins read billing events"
  on public.billing_events for select
  to authenticated
  using (public.is_admin());

-- No write policy: the webhook writes over the service role, which bypasses
-- RLS. A member has no reason to see any of this, including their own rows —
-- the payload is the processor's, not ours to redistribute.
