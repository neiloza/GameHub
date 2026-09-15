-- Listings: what a seller offers, and the thing every conversation is scoped to.

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,

  name text not null check (char_length(name) between 1 and 80),
  tagline text check (char_length(tagline) <= 140),

  -- Mirrors CATEGORIES in packages/shared/src/constants.ts. Adding a value
  -- means editing both, in one commit — this constraint is what turns a
  -- disagreement into a failed insert rather than a bad row.
  category text not null check (category in (
    'automotive', 'business_services', 'construction', 'consumer_products',
    'education_training', 'energy_utilities', 'entertainment_media',
    'fashion_apparel', 'financial_services', 'food_beverage',
    'health_wellness', 'home_garden', 'hospitality_travel',
    'industrial_manufacturing', 'legal_professional', 'logistics_transport',
    'marketing_advertising', 'nonprofit_community', 'pets_animals',
    'real_estate', 'software_technology', 'sports_recreation',
    'trades_home_services', 'other'
  )),

  stage text not null check (stage in ('concept', 'early', 'established', 'scaling')),
  location text check (char_length(location) <= 120),
  summary text check (char_length(summary) <= 4000),
  details text check (char_length(details) <= 8000),
  website text check (char_length(website) <= 500),
  price_cents bigint check (price_cents is null or price_cents >= 0),
  cover_image_url text,

  status text not null default 'draft' check (status in ('draft', 'published', 'suspended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_owner_idx on public.listings (owner_id);
-- The discovery feed filters on exactly these three, in this order.
create index listings_discovery_idx on public.listings (status, category, stage);
create index listings_name_idx on public.listings (name text_pattern_ops);

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

/** True when the caller owns this listing. The authority for listing-scoped writes. */
create or replace function public.owns_listing(p_listing_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.listings l
    where l.id = p_listing_id and l.owner_id = auth.uid()
  );
$$;

/**
 * Only an administrator may suspend or unsuspend.
 *
 * Without this, a seller could set `status = 'draft'` on a suspended listing
 * and republish it — the owner UPDATE policy permits the row, and RLS cannot
 * see which column changed.
 */
create or replace function public.protect_listing_suspension()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' and new.status = 'suspended' then
    raise exception 'not allowed to suspend a listing';
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status
     and (new.status = 'suspended' or old.status = 'suspended') then
    raise exception 'not allowed to change suspension status';
  end if;
  return new;
end;
$$;

create trigger listings_protect_suspension
  before insert or update on public.listings
  for each row execute function public.protect_listing_suspension();

alter table public.listings enable row level security;

-- Published listings are public: they are the product, and a signed-out visitor
-- landing on one from a search engine is the point.
create policy "published listings readable by anyone"
  on public.listings for select
  to anon, authenticated
  using (status = 'published');

create policy "owners read their own listings"
  on public.listings for select
  to authenticated
  using (owner_id = auth.uid());

create policy "admins read all listings"
  on public.listings for select
  to authenticated
  using (public.is_admin());

create policy "sellers insert their own listings"
  on public.listings for insert
  to authenticated
  with check (owner_id = auth.uid() and public.is_seller());

create policy "owners update their non-suspended listings"
  on public.listings for update
  to authenticated
  using (owner_id = auth.uid() and status <> 'suspended')
  with check (owner_id = auth.uid());

create policy "admins update any listing"
  on public.listings for update
  to authenticated
  using (public.is_admin())
  with check (true);

create policy "owners delete their own listings"
  on public.listings for delete
  to authenticated
  using (owner_id = auth.uid());

-- --- listing image storage --------------------------------------------------
--
-- Namespaced by listing rather than by seller, so owns_listing() stays the
-- single authority on who may write listing-scoped data.

create policy "listing images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'listing-images');

create policy "owners write their listing images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and public.owns_listing(public.storage_folder_uuid(name))
  );

create policy "owners replace their listing images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and public.owns_listing(public.storage_folder_uuid(name))
  );

create policy "owners delete their listing images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and public.owns_listing(public.storage_folder_uuid(name))
  );
