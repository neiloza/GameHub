-- Advertising: the advertiser's listing, their campaigns, and the counts.
--
-- An advertiser reaches their own rows and nothing that belongs to a buyer or a
-- seller. There is no policy here that would let them read a profile they have
-- not been contacted by, and no function that returns one.

create table public.advertisers (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  company_name text not null check (char_length(company_name) between 1 and 200),
  blurb text not null check (char_length(blurb) between 1 and 400),
  website text not null check (char_length(website) between 1 and 500),
  logo_url text,
  -- Listed in the public directory. An administrator decides, not the
  -- advertiser: the directory is an endorsement of sorts, and paying for a
  -- placement is not the same as being vouched for.
  listed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger advertisers_updated_at
  before update on public.advertisers
  for each row execute function public.set_updated_at();

/**
 * Only an administrator may list or delist.
 *
 * The advertiser owns the row and the owner UPDATE policy permits it, so this
 * is the same column-guard pattern used for profiles and listings.
 */
create or replace function public.protect_advertiser_listing()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.listed := false;
    return new;
  end if;
  if new.listed is distinct from old.listed then
    raise exception 'not allowed to change your own directory listing';
  end if;
  return new;
end;
$$;

create trigger advertisers_protect_listing
  before insert or update on public.advertisers
  for each row execute function public.protect_advertiser_listing();

alter table public.advertisers enable row level security;

-- The directory is readable by anyone, signed in or not: it is a public page.
create policy "listed advertisers are publicly readable"
  on public.advertisers for select
  to anon, authenticated
  using (listed = true);

create policy "advertisers read their own record"
  on public.advertisers for select
  to authenticated
  using (profile_id = auth.uid());

create policy "admins read all advertisers"
  on public.advertisers for select
  to authenticated
  using (public.is_admin());

create policy "advertisers write their own record"
  on public.advertisers for insert
  to authenticated
  with check (profile_id = auth.uid() and public.is_advertiser());

create policy "advertisers update their own record"
  on public.advertisers for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "admins update any advertiser"
  on public.advertisers for update
  to authenticated
  using (public.is_admin())
  with check (true);

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers (profile_id) on delete cascade,

  -- Mirrors AD_PLACEMENTS in packages/shared/src/constants.ts. A placement is a
  -- contract between a slot component and these rows: the component asks for
  -- one by name and this filters on it. Nothing is inferred.
  placement text not null check (placement in (
    'discovery_feed', 'listing_detail', 'dashboard', 'directory'
  )),

  headline text not null check (char_length(headline) between 1 and 80),
  body text not null check (char_length(body) between 1 and 240),
  destination_url text not null check (char_length(destination_url) between 1 and 500),
  image_url text,

  starts_on date not null,
  ends_on date not null,
  budget_cents bigint not null check (budget_cents >= 0),

  status text not null default 'draft'
    check (status in ('draft', 'pending', 'active', 'paused', 'ended')),
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (ends_on >= starts_on)
);

-- The slot query filters on exactly these, in this order.
create index ad_campaigns_slot_idx
  on public.ad_campaigns (placement, status, starts_on, ends_on);
create index ad_campaigns_advertiser_idx on public.ad_campaigns (advertiser_id);

create trigger ad_campaigns_updated_at
  before update on public.ad_campaigns
  for each row execute function public.set_updated_at();

/**
 * An advertiser may move a campaign between `active` and `paused`, and submit a
 * draft for review. Going live is an administrator's decision.
 *
 * Pausing is deliberately instant and self-serve: an advertiser who wants their
 * ad down now should not have to wait for a person.
 */
create or replace function public.protect_campaign_status()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A new campaign is submitted for review, whatever was posted.
    new.status := 'pending';
    new.approved_by := null;
    new.approved_at := null;
    return new;
  end if;

  if new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at then
    raise exception 'not allowed to approve your own campaign';
  end if;

  if new.status is distinct from old.status then
    -- The only transitions an advertiser may make themselves.
    if not (
      (old.status = 'active' and new.status = 'paused')
      or (old.status = 'paused' and new.status = 'active')
      or (old.status = 'draft' and new.status = 'pending')
      or (new.status = 'ended')
    ) then
      raise exception 'not allowed to move a campaign from % to %', old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

create trigger ad_campaigns_protect_status
  before insert or update on public.ad_campaigns
  for each row execute function public.protect_campaign_status();

alter table public.ad_campaigns enable row level security;

-- Every signed-in member reads live campaigns: that is how a slot renders.
-- Only the fields in this table are exposed, and none of them is private.
create policy "live campaigns are readable by members"
  on public.ad_campaigns for select
  to authenticated
  using (status = 'active' and current_date between starts_on and ends_on);

create policy "advertisers read their own campaigns"
  on public.ad_campaigns for select
  to authenticated
  using (advertiser_id = auth.uid());

create policy "admins read all campaigns"
  on public.ad_campaigns for select
  to authenticated
  using (public.is_admin());

create policy "advertisers create their own campaigns"
  on public.ad_campaigns for insert
  to authenticated
  with check (advertiser_id = auth.uid() and public.is_advertiser());

create policy "advertisers update their own campaigns"
  on public.ad_campaigns for update
  to authenticated
  using (advertiser_id = auth.uid())
  with check (advertiser_id = auth.uid());

create policy "admins update any campaign"
  on public.ad_campaigns for update
  to authenticated
  using (public.is_admin())
  with check (true);

-- ---------------------------------------------------------------------------
-- ad_events
-- ---------------------------------------------------------------------------

create table public.ad_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns (id) on delete cascade,
  kind text not null check (kind in ('impression', 'click')),
  -- Nullable, and the advertiser can never read it: an advertiser gets counts,
  -- never an audience list. It exists so a person investigating suspicious
  -- numbers has something to investigate with.
  viewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ad_events_campaign_kind_idx on public.ad_events (campaign_id, kind);

alter table public.ad_events enable row level security;

/**
 * Record an impression or a click.
 *
 * Through a function rather than an insert policy so the viewer id comes from
 * the session rather than from the browser. That stops a campaign inflating its
 * own numbers, and it means this table needs no INSERT policy at all — which is
 * what stops one advertiser writing rows against another's campaign.
 */
create or replace function public.record_ad_event(p_campaign_id uuid, p_kind text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_kind not in ('impression', 'click') then
    raise exception 'unknown ad event kind: %', p_kind;
  end if;

  -- Only against a campaign that is actually live. A stale page open in a tab
  -- for a week should not keep billing an ended campaign.
  if not exists (
    select 1 from public.ad_campaigns c
    where c.id = p_campaign_id
      and c.status = 'active'
      and current_date between c.starts_on and c.ends_on
  ) then
    return;
  end if;

  -- An advertiser's own view of their own ad is not an impression.
  if exists (
    select 1 from public.ad_campaigns c
    where c.id = p_campaign_id and c.advertiser_id = auth.uid()
  ) then
    return;
  end if;

  insert into public.ad_events (campaign_id, kind, viewer_id)
  values (p_campaign_id, p_kind, auth.uid());
end;
$$;

/*
 * Counts only, enforced by a column grant rather than by convention.
 *
 * RLS decides which *rows* an advertiser may read; it has nothing to say about
 * columns. Without the revoke below, an advertiser could select `viewer_id`
 * from their own campaign's events and reconstruct exactly who saw their ad —
 * which is the one thing this table was designed not to hand out.
 */
revoke select on public.ad_events from authenticated;
grant select (id, campaign_id, kind, created_at) on public.ad_events to authenticated;

create policy "advertisers read events on their own campaigns"
  on public.ad_events for select
  to authenticated
  using (
    exists (
      select 1 from public.ad_campaigns c
      where c.id = campaign_id and c.advertiser_id = auth.uid()
    )
  );

create policy "admins read all ad events"
  on public.ad_events for select
  to authenticated
  using (public.is_admin());
