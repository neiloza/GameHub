-- The catalogue: how a shopper finds something.
--
-- Deliberately not a recommendation engine. A shopper types words, picks a
-- category, sorts by price, and pages through the result — the same thing every
-- shop has done since catalogues were printed, and the thing people already
-- know how to do. Ranking by a stored profile of what somebody "likes" is a
-- product decision with real costs (a cold-start problem, a filter bubble, and
-- a preferences table to keep honest), and it is not one a starter should make
-- on your behalf.
--
-- So this file is one function. Everything it needs is already indexed by the
-- listings migration.

/**
 * Search the catalogue.
 *
 * Runs as the caller, not security definer, so RLS decides what comes back:
 * published listings for anybody including a signed-out visitor, plus the
 * caller's own drafts if they happen to match. That is the right answer — a
 * seller searching their own shop should find their draft.
 *
 * `p_query` is matched with `plainto_tsquery`, which treats the input as words
 * rather than as query syntax. That matters: `websearch_to_tsquery` would let
 * somebody paste operators, and `to_tsquery` raises a syntax error on an
 * unbalanced quote — a search box that throws on an apostrophe is a search box
 * nobody uses twice.
 */
create or replace function public.search_catalogue(
  p_query text default null,
  p_category text default null,
  p_condition text default null,
  p_min_cents bigint default null,
  p_max_cents bigint default null,
  p_sort text default 'newest',
  p_limit int default 24,
  p_offset int default 0
)
returns setof public.listings
language sql stable
set search_path = public
as $$
  select l.*
  from public.listings l
  where l.status = 'published'
    and (p_category is null or l.category = p_category)
    and (p_condition is null or l.condition = p_condition)
    and (p_min_cents is null or l.price_cents >= p_min_cents)
    and (p_max_cents is null or l.price_cents <= p_max_cents)
    and (
      coalesce(btrim(p_query), '') = ''
      or to_tsvector(
           'english',
           l.name || ' ' || coalesce(l.tagline, '') || ' ' || coalesce(l.summary, '')
         ) @@ plainto_tsquery('english', p_query)
    )
    -- A blocked seller's listings disappear from the shopper's catalogue, and
    -- the shopper's from theirs. Signed out, auth.uid() is null and this is a
    -- no-op.
    and not public.is_blocked_between(auth.uid(), l.owner_id)
  order by
    case when p_sort = 'price_asc'  then l.price_cents end asc,
    case when p_sort = 'price_desc' then l.price_cents end desc,
    -- The fallback, and the tie-break for both price sorts: newest first. Named
    -- explicitly rather than left to the planner, because a catalogue that
    -- reorders equal-priced items between pages loses rows off the end of one
    -- page and repeats them on the next.
    l.created_at desc,
    l.id
  limit greatest(0, least(p_limit, 100))
  offset greatest(0, p_offset);
$$;

grant execute on function public.search_catalogue(
  text, text, text, bigint, bigint, text, int, int
) to anon, authenticated;

/**
 * How many listings a search matches, for the pager.
 *
 * A second function rather than a window function inside the first: a count
 * over the whole match set and a page of rows want different plans, and
 * `count(*) over ()` forces the planner to materialise every matching row to
 * return twenty-four of them.
 */
create or replace function public.count_catalogue(
  p_query text default null,
  p_category text default null,
  p_condition text default null,
  p_min_cents bigint default null,
  p_max_cents bigint default null
)
returns bigint
language sql stable
set search_path = public
as $$
  select count(*)
  from public.listings l
  where l.status = 'published'
    and (p_category is null or l.category = p_category)
    and (p_condition is null or l.condition = p_condition)
    and (p_min_cents is null or l.price_cents >= p_min_cents)
    and (p_max_cents is null or l.price_cents <= p_max_cents)
    and (
      coalesce(btrim(p_query), '') = ''
      or to_tsvector(
           'english',
           l.name || ' ' || coalesce(l.tagline, '') || ' ' || coalesce(l.summary, '')
         ) @@ plainto_tsquery('english', p_query)
    )
    and not public.is_blocked_between(auth.uid(), l.owner_id);
$$;

grant execute on function public.count_catalogue(text, text, text, bigint, bigint)
  to anon, authenticated;

/**
 * The seller behind a listing, for the shop header on a product page.
 *
 * `profiles` is already readable by any signed-in member, but a product page is
 * public — so this exists to give a signed-out visitor the seller's name and
 * verified badge, and nothing else. Security definer, returning three columns
 * chosen by hand rather than the row.
 */
create or replace function public.listing_seller(p_listing_id uuid)
returns table (id uuid, display_name text, verified boolean, location text)
language sql stable security definer
set search_path = public
as $$
  select p.id, p.display_name, p.verified, p.location
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where l.id = p_listing_id
    and (l.status = 'published' or l.owner_id = auth.uid() or public.is_admin());
$$;

grant execute on function public.listing_seller(uuid) to anon, authenticated;
