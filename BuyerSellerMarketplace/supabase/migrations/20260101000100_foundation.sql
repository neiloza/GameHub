-- Foundation: profiles, the role model, and the helpers every later policy uses.
--
-- Conventions the whole schema follows:
--   * money is integer cents in a bigint, never a float
--   * timestamps are timestamptz, always UTC
--   * RLS is enabled on every table, with at least one policy
--   * a column that must not be self-written is guarded by a BEFORE trigger,
--     because RLS is row-level and cannot protect a single column

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- The five parties. `both` sells and buys; administrators are not a role,
  -- they are is_admin on top of one.
  --
  -- Defaulted to 'buyer' because buying is the only thing anybody can do
  -- without being reviewed. That is the shape of a shop: browsing and buying
  -- are open to everyone, and it is *selling* that is vetted. Selling, running
  -- ads and promoting all arrive through review_application().
  role text not null default 'buyer'
    check (role in ('seller', 'buyer', 'both', 'advertiser', 'promoter')),

  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  bio text check (char_length(bio) <= 2000),
  location text check (char_length(location) <= 120),
  website text check (char_length(website) <= 500),
  links jsonb not null default '{}'::jsonb,

  -- Identity-verified. Written by the verification webhook only.
  verified boolean not null default false,
  is_admin boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- role helpers
--
-- Security definer so a policy can consult `profiles` without recursing into
-- the policy that protects `profiles`. Each is stable and reads one row, so
-- Postgres can cache it for the duration of a statement.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_member()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_status = 'active'
  );
$$;

create or replace function public.is_seller()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select p.role in ('seller', 'both') and p.account_status = 'active'
     from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_buyer()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select p.role in ('buyer', 'both') and p.account_status = 'active'
     from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_advertiser()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'advertiser' and p.account_status = 'active'
     from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_promoter()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'promoter' and p.account_status = 'active'
     from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- the column guard
-- ---------------------------------------------------------------------------

/**
 * Guards profiles.role, .verified, .is_admin and .account_status.
 *
 * RLS is row-level and cannot protect a single column, and the "members update
 * their own profile" policy below permits the whole row. Without this, one
 * PATCH would let a member grant themselves 'advertiser' or 'buyer' — and every
 * is_*() helper above reads that column, so that one write would open the
 * advertiser portal, the buyer feed and their policies at once.
 *
 * Only the buyer role is self-serve. Seller, advertiser and promoter arrive
 * through review_application(), which is security definer and runs as an
 * administrator, so it reaches the short-circuit at the top.
 */
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Service role (auth.uid() is null — seeds, edge functions) and
  -- administrators pass through untouched.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Account setup creates this row. Forcing the value rather than rejecting
    -- the insert keeps /onboarding working when it posts a role, and closes the
    -- hole when it posts somebody else's.
    new.role := 'buyer';
    new.verified := false;
    new.is_admin := false;
    new.account_status := 'active';
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'not allowed to change your own role';
  end if;

  if new.verified is distinct from old.verified
     or new.is_admin is distinct from old.is_admin
     or new.account_status is distinct from old.account_status then
    raise exception 'not allowed to change privileged profile columns';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileged
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

alter table public.profiles enable row level security;

-- A profile is readable by any signed-in member: it is the name and picture
-- beside a listing, a message and a review queue. Nothing private lives here —
-- contact details are on the application, which has its own policies.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (true);

-- ---------------------------------------------------------------------------
-- admin_audit_log
--
-- Defined here because almost every later migration writes to it, and because
-- an audit row that is written in a different transaction from the change it
-- records is worse than no audit row at all: an action that succeeded but was
-- not logged, or logged but did not happen, is the one thing nobody can
-- untangle afterwards. Every privileged function below writes here inline.
-- ---------------------------------------------------------------------------

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id),
  action text not null check (char_length(action) between 1 and 80),
  subject_table text not null check (char_length(subject_table) between 1 and 80),
  subject_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_subject_idx on public.admin_audit_log (subject_table, subject_id);

alter table public.admin_audit_log enable row level security;

-- Readable by administrators; written only by the security-definer functions
-- that make the changes. There is deliberately no INSERT policy: a log anybody
-- can write to is not a log.
create policy "admins read the audit log"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- blocks
--
-- Defined this early because the discovery feed filters on it, and the feed is
-- built before conversations exist. A block is one-directional as a row and
-- symmetric as a rule: is_blocked_between() checks both ways, so blocking
-- somebody hides each of you from the other everywhere at once.
-- ---------------------------------------------------------------------------

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

alter table public.blocks enable row level security;

-- A member reads and writes only the blocks they made. Deliberately not
-- readable by the blocked party: "who blocked me" is not a list anybody should
-- be handed.
create policy "members manage their own blocks"
  on public.blocks for all
  to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create policy "admins read all blocks"
  on public.blocks for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- storage
-- ---------------------------------------------------------------------------

-- Public read is deliberate: an avatar or a listing image is meant to be seen
-- by anyone who can see the row pointing at it, and signed URLs would mean a
-- round trip per image on every card in a feed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
   array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('listing-images', 'listing-images', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

/** The first path segment as a uuid, or null when it is not one. */
create or replace function public.storage_folder_uuid(p_name text)
returns uuid
language plpgsql immutable
as $$
begin
  return (storage.foldername(p_name))[1]::uuid;
exception
  when others then return null;
end;
$$;

create policy "avatars are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "members write their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and public.storage_folder_uuid(name) = auth.uid());

create policy "members replace their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and public.storage_folder_uuid(name) = auth.uid());

create policy "members delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and public.storage_folder_uuid(name) = auth.uid());

-- Listing image policies are defined in the listings migration, where
-- owns_listing() exists.
