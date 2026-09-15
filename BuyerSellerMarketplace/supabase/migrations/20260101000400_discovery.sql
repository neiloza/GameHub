-- Discovery: buyer preferences, swipes, and the mutual-consent match.
--
-- The trust model in one sentence: a buyer expressing interest creates a
-- *request*, and only the seller accepting it creates a conversation. Nobody on
-- this platform can be messaged by a stranger.

-- ---------------------------------------------------------------------------
-- buyer_profiles — what a buyer is looking for
-- ---------------------------------------------------------------------------

create table public.buyer_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  categories text[] not null default '{}',
  stages text[] not null default '{}',
  budget_min_cents bigint check (budget_min_cents is null or budget_min_cents >= 0),
  budget_max_cents bigint check (budget_max_cents is null or budget_max_cents >= 0),
  locations text[] not null default '{}',
  notes text check (char_length(notes) <= 2000),
  updated_at timestamptz not null default now(),
  check (
    budget_min_cents is null or budget_max_cents is null
    or budget_min_cents <= budget_max_cents
  )
);

create trigger buyer_profiles_updated_at
  before update on public.buyer_profiles
  for each row execute function public.set_updated_at();

alter table public.buyer_profiles enable row level security;

create policy "buyers manage their own preferences"
  on public.buyer_profiles for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- approval gate
-- ---------------------------------------------------------------------------

/**
 * A buyer may only see the feed once an administrator has approved them.
 *
 * Holding the `buyer` role is not enough on its own: the role is granted *by*
 * approving the application, but an administrator can also set a role directly,
 * and sellers are told every buyer who reaches them has been reviewed. Checking
 * for the approved row is what makes that true rather than nearly true.
 */
create or replace function public.is_approved_buyer()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_buyer() and exists (
    select 1 from public.buyer_applications a
    where a.profile_id = auth.uid() and a.status = 'approved'
  );
$$;

-- ---------------------------------------------------------------------------
-- swipes
-- ---------------------------------------------------------------------------

create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  direction text not null check (direction in ('interested', 'pass')),
  created_at timestamptz not null default now(),
  unique (buyer_id, listing_id)
);

create index swipes_listing_idx on public.swipes (listing_id);

alter table public.swipes enable row level security;

create policy "buyers manage their own swipes"
  on public.swipes for all
  to authenticated
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid() and public.is_approved_buyer());

-- A seller never sees a pass. Knowing who passed on your listing is
-- information nobody asked for and nothing can be done with.
create policy "admins read swipes"
  on public.swipes for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (buyer_id, listing_id)
);

create index matches_listing_status_idx on public.matches (listing_id, status);

alter table public.matches enable row level security;

create policy "buyers read their own matches"
  on public.matches for select
  to authenticated
  using (buyer_id = auth.uid());

create policy "sellers read matches on their listings"
  on public.matches for select
  to authenticated
  using (public.owns_listing(listing_id));

create policy "admins read all matches"
  on public.matches for select
  to authenticated
  using (public.is_admin());

-- No INSERT or UPDATE policy: rows arrive from the swipe trigger and change
-- through respond_to_match(), both security definer. A member writing here
-- directly would be creating a match nobody consented to.

/**
 * An `interested` swipe raises a request for the seller to answer.
 *
 * A `pass` writes nothing here, and re-swiping interested after a pass raises
 * the request then. `on conflict do nothing` makes the whole thing idempotent,
 * which matters because the client upserts the swipe.
 */
create or replace function public.handle_new_swipe()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.direction <> 'interested' then
    return new;
  end if;

  insert into public.matches (buyer_id, listing_id)
  values (new.buyer_id, new.listing_id)
  on conflict (buyer_id, listing_id) do nothing;

  return new;
end;
$$;

create trigger swipes_raise_match
  after insert or update on public.swipes
  for each row execute function public.handle_new_swipe();

-- ---------------------------------------------------------------------------
-- the feed
-- ---------------------------------------------------------------------------

/**
 * The ranked discovery feed for the calling buyer.
 *
 * The weights mirror `SCORE_WEIGHTS` in packages/shared/src/lib/matching.ts,
 * which is what lets a card explain why it is where it is. Change one and
 * change the other in the same commit.
 *
 * Security definer, and it checks is_approved_buyer() itself: the whole point
 * is that an unapproved account gets an empty feed rather than an error it
 * could learn from.
 */
create or replace function public.get_discovery_feed(p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, owner_id uuid, name text, tagline text, category text, stage text,
  location text, summary text, details text, website text, price_cents bigint,
  cover_image_url text, status text, created_at timestamptz, updated_at timestamptz,
  score int
)
language sql stable security definer
set search_path = public
as $$
  with prefs as (
    select * from public.buyer_profiles where profile_id = auth.uid()
  )
  select
    l.id, l.owner_id, l.name, l.tagline, l.category, l.stage, l.location,
    l.summary, l.details, l.website, l.price_cents, l.cover_image_url,
    l.status, l.created_at, l.updated_at,
    (
      (case when l.category = any (coalesce(p.categories, '{}')) then 3 else 0 end) +
      (case when l.stage = any (coalesce(p.stages, '{}')) then 2 else 0 end) +
      (case when l.price_cents is not null
             and l.price_cents >= coalesce(p.budget_min_cents, 0)
             and l.price_cents <= coalesce(p.budget_max_cents, 9223372036854775807)
            then 1 else 0 end) +
      (case when l.location is not null and exists (
              select 1 from unnest(coalesce(p.locations, '{}')) g
              where l.location ilike '%' || g || '%'
            ) then 1 else 0 end)
    )::int as score
  from public.listings l
  left join prefs p on true
  where public.is_approved_buyer()
    and l.status = 'published'
    and l.owner_id <> auth.uid()
    -- Already answered: a swiped listing leaves the feed either way.
    and not exists (
      select 1 from public.swipes s
      where s.buyer_id = auth.uid() and s.listing_id = l.id
    )
    -- A block hides both parties from each other, in both directions.
    and not public.is_blocked_between(auth.uid(), l.owner_id)
  order by score desc, l.created_at desc
  limit greatest(0, least(p_limit, 100))
  offset greatest(0, p_offset);
$$;

/** Listings this buyer passed on, so a pass made by accident can be undone. */
create or replace function public.get_skipped_feed(p_limit int default 20)
returns setof public.listings
language sql stable security definer
set search_path = public
as $$
  select l.*
  from public.listings l
  join public.swipes s on s.listing_id = l.id
  where s.buyer_id = auth.uid()
    and s.direction = 'pass'
    and l.status = 'published'
  order by s.created_at desc
  limit greatest(0, least(p_limit, 100));
$$;
