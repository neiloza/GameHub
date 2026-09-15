-- Onboarding progress, identity verification, product feedback, and the
-- administrator functions that need every other table to exist.

-- ---------------------------------------------------------------------------
-- onboarding_completions
--
-- Keyed on (profile_id, role), not on the profile. One account can hold more
-- than one role over its life — `both` exists, and approving an application
-- rewrites profiles.role in place — and a single `onboarded` column would mark
-- a seller done for ever and silently swallow the buyer walkthrough the day
-- their application is approved.
--
-- Administrators are deliberately absent from the CHECK: the console is not a
-- first-run experience.
-- ---------------------------------------------------------------------------

create table public.onboarding_completions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('seller', 'buyer', 'advertiser', 'promoter')),
  -- Highest step reached, so a tour closed halfway resumes rather than restarts.
  last_step int not null default 0 check (last_step >= 0),
  -- True when the member chose "skip" rather than reaching the end. Both stop
  -- the tour opening by itself; this records which happened, which is what
  -- tells "nobody needs this" from "everybody closes it".
  dismissed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, role)
);

create index onboarding_completions_profile_idx on public.onboarding_completions (profile_id);

create trigger onboarding_completions_updated_at
  before update on public.onboarding_completions
  for each row execute function public.set_updated_at();

alter table public.onboarding_completions enable row level security;

-- Entirely self-owned state, with nothing privileged in it, so a plain owner
-- policy per verb is enough and no trigger guard is needed. Deleting is how
-- "replay the tour" works.
create policy "members manage their own onboarding state"
  on public.onboarding_completions for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "admins read onboarding state"
  on public.onboarding_completions for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- identity_verifications
--
-- What this table does not contain is the design: no document, no image, no
-- scan, no government number. The check runs at the provider; we keep a session
-- id and an outcome. If this database is ever breached, the thing a verified
-- member most needs protected was never in it.
-- ---------------------------------------------------------------------------

create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'unstarted'
    check (status in ('unstarted', 'pending', 'verified', 'failed')),
  session_id text,
  failure_reason text check (char_length(failure_reason) <= 500),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index identity_verifications_profile_idx
  on public.identity_verifications (profile_id, created_at desc);

create trigger identity_verifications_updated_at
  before update on public.identity_verifications
  for each row execute function public.set_updated_at();

alter table public.identity_verifications enable row level security;

create policy "members read their own verification"
  on public.identity_verifications for select
  to authenticated
  using (profile_id = auth.uid());

create policy "admins read all verifications"
  on public.identity_verifications for select
  to authenticated
  using (public.is_admin());

-- No write policy for anybody. The `identity-verify` function starts a session
-- and the webhook records the outcome, both over the service role. A member who
-- could update this row could mark themselves verified, and `profiles.verified`
-- is what the badge reads.

/**
 * Record an outcome, and mirror it onto the profile.
 *
 * Called by the webhook over the service role, where auth.uid() is null — which
 * is exactly the branch protect_profile_privileged_columns() lets through.
 */
create or replace function public.handle_identity_outcome(
  p_profile_id uuid,
  p_session_id text,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_status not in ('pending', 'verified', 'failed') then
    raise exception 'unknown verification status: %', p_status;
  end if;

  insert into public.identity_verifications (profile_id, session_id, status, failure_reason, verified_at)
  values (
    p_profile_id, p_session_id, p_status, p_reason,
    case when p_status = 'verified' then now() end
  );

  if p_status = 'verified' then
    update public.profiles set verified = true where id = p_profile_id;
    perform public.notify_profile(p_profile_id, 'identity_verified', '{}'::jsonb);
  end if;
end;
$$;

revoke execute on function public.handle_identity_outcome(uuid, text, text, text)
  from public, authenticated, anon;
grant execute on function public.handle_identity_outcome(uuid, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- feature_feedback
-- ---------------------------------------------------------------------------

create table public.feature_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,

  -- Which half of the product this is about. Set from the route the member was
  -- standing on, not from their role — see feedbackSurfaceFor().
  surface text not null check (surface in ('seller', 'buyer')),
  category text not null check (category in ('bug', 'idea', 'confusing', 'praise', 'other')),
  impact text not null check (impact in ('blocking', 'annoying', 'minor')),

  title text not null check (char_length(title) between 1 and 140),
  body text not null check (char_length(body) between 1 and 4000),
  -- Captured automatically, so a report can be reproduced without asking the
  -- member to describe the page they were on.
  pathname text check (char_length(pathname) <= 500),

  status text not null default 'new'
    check (status in ('new', 'triaged', 'planned', 'shipped', 'declined')),
  response text check (char_length(response) <= 4000),
  responded_by uuid references public.profiles (id),
  responded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feature_feedback_status_idx on public.feature_feedback (status, created_at desc);
create index feature_feedback_profile_idx on public.feature_feedback (profile_id);

create trigger feature_feedback_updated_at
  before update on public.feature_feedback
  for each row execute function public.set_updated_at();

/** A member may only file, never triage or answer their own. */
create or replace function public.protect_feedback_response_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'new';
    new.response := null;
    new.responded_by := null;
    new.responded_at := null;
    return new;
  end if;
  raise exception 'feedback cannot be edited after it is sent';
end;
$$;

create trigger feature_feedback_protect
  before insert or update on public.feature_feedback
  for each row execute function public.protect_feedback_response_columns();

/** Who may speak from which surface. Mirrors feedbackSurfaceFor() in the client. */
create or replace function public.may_give_feedback_as(p_surface text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select case p_surface
    when 'seller' then public.is_seller()
    when 'buyer'  then public.is_buyer()
    else false
  end;
$$;

alter table public.feature_feedback enable row level security;

create policy "members read their own feedback"
  on public.feature_feedback for select
  to authenticated
  using (profile_id = auth.uid());

create policy "members send feedback from a surface they hold"
  on public.feature_feedback for insert
  to authenticated
  with check (profile_id = auth.uid() and public.may_give_feedback_as(surface));

create policy "admins read all feedback"
  on public.feature_feedback for select
  to authenticated
  using (public.is_admin());

create policy "admins respond to feedback"
  on public.feature_feedback for update
  to authenticated
  using (public.is_admin())
  with check (true);

-- ---------------------------------------------------------------------------
-- administrator functions
--
-- Last, because each of them touches tables defined across every migration
-- above. Every one writes an audit row in the same transaction as the change:
-- an action that succeeded but was not logged, or was logged but did not
-- happen, is the one thing nobody can untangle afterwards.
-- ---------------------------------------------------------------------------

create or replace function public.admin_search_accounts(p_query text, p_limit int default 50)
returns setof public.profiles
language sql stable security definer
set search_path = public
as $$
  select p.* from public.profiles p
   where public.is_admin()
     and (
       coalesce(btrim(p_query), '') = ''
       or p.display_name ilike '%' || p_query || '%'
       or p.id::text = btrim(p_query)
     )
   order by p.created_at desc
   limit greatest(0, least(p_limit, 200));
$$;

/**
 * Change somebody's role.
 *
 * The other sanctioned way past the profile guard, alongside
 * review_application(). This exists for what an application cannot express:
 * correcting a mistake, granting `both`, or moving an account between sides at
 * its owner's request.
 */
create or replace function public.admin_set_role(p_profile_id uuid, p_role text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_old text;
begin
  if not public.is_admin() then
    raise exception 'only an administrator may change a role';
  end if;
  if p_role not in ('seller', 'buyer', 'both', 'advertiser', 'promoter') then
    raise exception 'unknown role: %', p_role;
  end if;

  select role into v_old from public.profiles where id = p_profile_id;
  if v_old is null then
    raise exception 'profile not found';
  end if;

  update public.profiles set role = p_role where id = p_profile_id;

  insert into public.admin_audit_log (actor_id, action, subject_table, subject_id, detail)
  values (
    auth.uid(), 'set_role', 'profiles', p_profile_id,
    jsonb_build_object('from', v_old, 'to', p_role)
  );
end;
$$;

create or replace function public.admin_set_account_status(p_profile_id uuid, p_status text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_old text;
begin
  if not public.is_admin() then
    raise exception 'only an administrator may suspend an account';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'unknown account status: %', p_status;
  end if;

  -- An administrator suspending themselves would lock the console with nobody
  -- able to reopen it.
  if p_profile_id = auth.uid() and p_status = 'suspended' then
    raise exception 'you cannot suspend your own account';
  end if;

  select account_status into v_old from public.profiles where id = p_profile_id;
  if v_old is null then
    raise exception 'profile not found';
  end if;

  update public.profiles set account_status = p_status where id = p_profile_id;

  insert into public.admin_audit_log (actor_id, action, subject_table, subject_id, detail)
  values (
    auth.uid(), 'set_account_status', 'profiles', p_profile_id,
    jsonb_build_object('from', v_old, 'to', p_status)
  );
end;
$$;

/** Log a suspension the moment it happens, whoever made it and however. */
create or replace function public.audit_listing_suspension()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and (new.status = 'suspended' or old.status = 'suspended')
     and auth.uid() is not null then
    insert into public.admin_audit_log (actor_id, action, subject_table, subject_id, detail)
    values (
      auth.uid(), 'set_listing_status', 'listings', new.id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger listings_audit_suspension
  after update on public.listings
  for each row execute function public.audit_listing_suspension();
