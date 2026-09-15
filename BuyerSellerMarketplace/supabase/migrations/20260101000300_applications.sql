-- Applications: how an account becomes a buyer, an advertiser or a promoter.
--
-- Three tables rather than one with a `kind` column, because the payloads have
-- nothing in common past the contact block — a buyer states a budget, an
-- advertiser states placements, a promoter states channels. One table would be
-- a wide sheet of columns that are null for two kinds out of three, held
-- together by CHECK constraints saying which. The shared *workflow* lives in
-- review_application() at the bottom of this file.
--
-- Seller is the only self-serve role. Everything else is reviewed by a person,
-- and review_application() is the single sanctioned path past the role guard in
-- the foundation migration.

-- ---------------------------------------------------------------------------
-- buyer_applications
-- ---------------------------------------------------------------------------

create table public.buyer_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,

  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 200),
  website text check (char_length(website) <= 500),
  motivation text not null check (char_length(motivation) between 1 and 4000),

  buyer_type text not null check (buyer_type in (
    'individual', 'business', 'institution', 'intermediary', 'other'
  )),
  organization text check (char_length(organization) <= 200),
  categories text[] not null default '{}',
  budget_min_cents bigint check (budget_min_cents is null or budget_min_cents >= 0),
  budget_max_cents bigint check (budget_max_cents is null or budget_max_cents >= 0),

  status text not null default 'pending'
    check (status in ('pending', 'info_requested', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 4000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- advertiser_applications
-- ---------------------------------------------------------------------------

create table public.advertiser_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,

  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 200),
  website text check (char_length(website) <= 500),
  motivation text not null check (char_length(motivation) between 1 and 4000),

  company_name text not null check (char_length(company_name) between 1 and 200),
  placements text[] not null default '{}',

  status text not null default 'pending'
    check (status in ('pending', 'info_requested', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 4000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- promoter_applications
-- ---------------------------------------------------------------------------

create table public.promoter_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,

  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 200),
  website text check (char_length(website) <= 500),
  motivation text not null check (char_length(motivation) between 1 and 4000),

  promoter_type text not null check (promoter_type in (
    'creator', 'community', 'agency', 'consultant', 'other'
  )),
  platforms text[] not null default '{}',
  audience_size int check (audience_size is null or audience_size >= 0),
  estimated_monthly_referrals text not null check (estimated_monthly_referrals in (
    'under_10', '10_to_50', '50_to_200', 'over_200'
  )),

  status text not null default 'pending'
    check (status in ('pending', 'info_requested', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 4000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index buyer_applications_status_idx on public.buyer_applications (status, created_at);
create index advertiser_applications_status_idx
  on public.advertiser_applications (status, created_at);
create index promoter_applications_status_idx
  on public.promoter_applications (status, created_at);

create index buyer_applications_profile_idx on public.buyer_applications (profile_id);
create index advertiser_applications_profile_idx on public.advertiser_applications (profile_id);
create index promoter_applications_profile_idx on public.promoter_applications (profile_id);

create trigger buyer_applications_updated_at
  before update on public.buyer_applications
  for each row execute function public.set_updated_at();
create trigger advertiser_applications_updated_at
  before update on public.advertiser_applications
  for each row execute function public.set_updated_at();
create trigger promoter_applications_updated_at
  before update on public.promoter_applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- the review-column guard
-- ---------------------------------------------------------------------------

/**
 * An applicant may edit their own answers while it is still open; they may
 * never touch the decision.
 *
 * Same reasoning as the profile guard: the owner UPDATE policy permits the row,
 * and RLS cannot see which column changed. Without this an applicant could set
 * `status = 'approved'` on their own row — which review_application() would
 * then never be asked about, but is_approved_buyer() reads directly.
 */
create or replace function public.protect_application_review_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    return new;
  end if;

  if new.status is distinct from old.status
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.review_note is distinct from old.review_note then
    raise exception 'not allowed to review your own application';
  end if;

  -- A decided application is a record. Re-applying means a new row.
  if old.status in ('approved', 'rejected') then
    raise exception 'this application has been decided and can no longer be edited';
  end if;

  return new;
end;
$$;

create trigger buyer_applications_protect_review
  before insert or update on public.buyer_applications
  for each row execute function public.protect_application_review_columns();
create trigger advertiser_applications_protect_review
  before insert or update on public.advertiser_applications
  for each row execute function public.protect_application_review_columns();
create trigger promoter_applications_protect_review
  before insert or update on public.promoter_applications
  for each row execute function public.protect_application_review_columns();

-- ---------------------------------------------------------------------------
-- policies — identical across the three, because the workflow is
-- ---------------------------------------------------------------------------

alter table public.buyer_applications enable row level security;
alter table public.advertiser_applications enable row level security;
alter table public.promoter_applications enable row level security;

create policy "applicants read their own buyer application"
  on public.buyer_applications for select to authenticated using (profile_id = auth.uid());
create policy "applicants submit their own buyer application"
  on public.buyer_applications for insert to authenticated with check (profile_id = auth.uid());
create policy "applicants amend their open buyer application"
  on public.buyer_applications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "admins read all buyer applications"
  on public.buyer_applications for select to authenticated using (public.is_admin());
create policy "admins review buyer applications"
  on public.buyer_applications for update to authenticated
  using (public.is_admin()) with check (true);

create policy "applicants read their own advertiser application"
  on public.advertiser_applications for select to authenticated using (profile_id = auth.uid());
create policy "applicants submit their own advertiser application"
  on public.advertiser_applications for insert to authenticated
  with check (profile_id = auth.uid());
create policy "applicants amend their open advertiser application"
  on public.advertiser_applications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "admins read all advertiser applications"
  on public.advertiser_applications for select to authenticated using (public.is_admin());
create policy "admins review advertiser applications"
  on public.advertiser_applications for update to authenticated
  using (public.is_admin()) with check (true);

create policy "applicants read their own promoter application"
  on public.promoter_applications for select to authenticated using (profile_id = auth.uid());
create policy "applicants submit their own promoter application"
  on public.promoter_applications for insert to authenticated
  with check (profile_id = auth.uid());
create policy "applicants amend their open promoter application"
  on public.promoter_applications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "admins read all promoter applications"
  on public.promoter_applications for select to authenticated using (public.is_admin());
create policy "admins review promoter applications"
  on public.promoter_applications for update to authenticated
  using (public.is_admin()) with check (true);

-- ---------------------------------------------------------------------------
-- the thread, and the notes
-- ---------------------------------------------------------------------------

create table public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_kind text not null check (application_kind in ('buyer', 'advertiser', 'promoter')),
  application_id uuid not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index application_messages_thread_idx
  on public.application_messages (application_kind, application_id, created_at);

/**
 * Reviewer-only notes.
 *
 * A separate table from `application_messages` on purpose. The applicant can
 * read their own thread, and a note written in the same table would be one RLS
 * mistake away from being read by the person it is about. Separate tables make
 * that a property of the schema rather than a detail of a policy.
 */
create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_kind text not null check (application_kind in ('buyer', 'advertiser', 'promoter')),
  application_id uuid not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index application_notes_thread_idx
  on public.application_notes (application_kind, application_id, created_at);

/** True when the caller owns the application this row is attached to. */
create or replace function public.owns_application(p_kind text, p_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  -- No dynamic SQL: three tables, three branches, and nothing built from a
  -- caller-supplied string.
  if p_kind = 'buyer' then
    select profile_id into v_owner from public.buyer_applications where id = p_id;
  elsif p_kind = 'advertiser' then
    select profile_id into v_owner from public.advertiser_applications where id = p_id;
  elsif p_kind = 'promoter' then
    select profile_id into v_owner from public.promoter_applications where id = p_id;
  else
    return false;
  end if;
  return v_owner = auth.uid();
end;
$$;

alter table public.application_messages enable row level security;
alter table public.application_notes enable row level security;

create policy "participants read the application thread"
  on public.application_messages for select
  to authenticated
  using (public.owns_application(application_kind, application_id) or public.is_admin());

create policy "participants write to the application thread"
  on public.application_messages for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (public.owns_application(application_kind, application_id) or public.is_admin())
  );

-- Notes: admin only, both ways. No policy grants the applicant anything.
create policy "admins read application notes"
  on public.application_notes for select to authenticated using (public.is_admin());
create policy "admins write application notes"
  on public.application_notes for insert
  to authenticated
  with check (public.is_admin() and author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- the decision
-- ---------------------------------------------------------------------------

/**
 * Decide an application, and grant the role when approving.
 *
 * Security definer, so it passes the is_admin() short-circuit in
 * protect_profile_privileged_columns() — this is the only sanctioned path that
 * writes `profiles.role`, and it is why that guard can be absolute everywhere
 * else.
 *
 * Approving a buyer for an account that already sells makes it `both` rather
 * than replacing the role: somebody who lists and buys should not lose their
 * listings to get a feed.
 */
create or replace function public.review_application(
  p_kind text,
  p_application_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_current text;
  v_new_role text;
begin
  if not public.is_admin() then
    raise exception 'only an administrator may review an application';
  end if;

  if p_status not in ('pending', 'info_requested', 'approved', 'rejected') then
    raise exception 'unknown review status: %', p_status;
  end if;

  -- "Rejected, no reason given" is the outcome applicants complain about, and
  -- the one an administrator cannot defend six months later.
  if p_status <> 'approved' and coalesce(btrim(p_note), '') = '' then
    raise exception 'a note is required for any outcome other than approval';
  end if;

  if p_kind = 'buyer' then
    update public.buyer_applications
       set status = p_status, review_note = p_note,
           reviewed_by = auth.uid(), reviewed_at = now()
     where id = p_application_id
     returning profile_id into v_profile;
  elsif p_kind = 'advertiser' then
    update public.advertiser_applications
       set status = p_status, review_note = p_note,
           reviewed_by = auth.uid(), reviewed_at = now()
     where id = p_application_id
     returning profile_id into v_profile;
  elsif p_kind = 'promoter' then
    update public.promoter_applications
       set status = p_status, review_note = p_note,
           reviewed_by = auth.uid(), reviewed_at = now()
     where id = p_application_id
     returning profile_id into v_profile;
  else
    raise exception 'unknown application kind: %', p_kind;
  end if;

  if v_profile is null then
    raise exception 'application not found';
  end if;

  if p_status = 'approved' then
    select role into v_current from public.profiles where id = v_profile;

    v_new_role := case
      -- An account that sells and is approved to buy does both.
      when p_kind = 'buyer' and v_current in ('seller', 'both') then 'both'
      when p_kind = 'buyer' then 'buyer'
      when p_kind = 'advertiser' then 'advertiser'
      when p_kind = 'promoter' then 'promoter'
    end;

    update public.profiles set role = v_new_role where id = v_profile;
  end if;

  insert into public.admin_audit_log (actor_id, action, subject_table, subject_id, detail)
  values (
    auth.uid(),
    'review_application',
    p_kind || '_applications',
    p_application_id,
    jsonb_build_object('status', p_status, 'profile_id', v_profile)
  );
end;
$$;
