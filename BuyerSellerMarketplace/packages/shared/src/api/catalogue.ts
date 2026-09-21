import type { MarketplaceClient } from './client';
import { CATALOGUE_PAGE_SIZE } from '../constants';
import type { CatalogueSort, Category, ListingCondition } from '../constants';
import type { Listing, ListingSeller } from '../types/database';

/**
 * The catalogue.
 *
 * Search and filters, not recommendations. A shopper types words, narrows by
 * category and condition, sorts by price and pages through the result — the
 * same thing every shop has done since catalogues were printed, and the thing
 * people already know how to do without being taught.
 *
 * Every call here works signed out: `search_catalogue` and `count_catalogue`
 * are granted to `anon`, and published listings are readable by `anon` in RLS.
 * A shop you need an account to look at is not a shop.
 */

export type CatalogueFilters = {
  query?: string;
  category?: Category;
  condition?: ListingCondition;
  minCents?: number;
  maxCents?: number;
  sort?: CatalogueSort;
  page?: number;
};

export type CataloguePage = {
  listings: Listing[];
  total: number;
  page: number;
  pageCount: number;
};

/** The arguments both functions share, so the two can never drift apart. */
function filterArgs(filters: CatalogueFilters) {
  return {
    p_query: filters.query?.trim() || null,
    p_category: filters.category ?? null,
    p_condition: filters.condition ?? null,
    p_min_cents: filters.minCents ?? null,
    p_max_cents: filters.maxCents ?? null,
  };
}

/**
 * One page of the catalogue, with the count for the pager.
 *
 * The two queries go out together rather than in sequence: they are independent
 * and each is a round trip, so awaiting them one after the other would double
 * the time the shop takes to paint for no reason.
 */
export async function searchCatalogue(
  client: MarketplaceClient,
  filters: CatalogueFilters = {}
): Promise<CataloguePage> {
  const page = Math.max(1, filters.page ?? 1);
  const args = filterArgs(filters);

  const [rows, count] = await Promise.all([
    client.rpc('search_catalogue', {
      ...args,
      p_sort: filters.sort ?? 'newest',
      p_limit: CATALOGUE_PAGE_SIZE,
      p_offset: (page - 1) * CATALOGUE_PAGE_SIZE,
    }),
    client.rpc('count_catalogue', args),
  ]);

  if (rows.error) throw new Error(rows.error.message);
  if (count.error) throw new Error(count.error.message);

  const total = Number(count.data ?? 0);
  return {
    listings: (rows.data ?? []) as Listing[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CATALOGUE_PAGE_SIZE)),
  };
}

/**
 * The seller behind a listing, for the shop line on a product page.
 *
 * A function rather than a join, because a product page is public and
 * `profiles` is not: this returns four columns chosen by hand, and nothing a
 * stranger should not see.
 */
export async function getListingSeller(
  client: MarketplaceClient,
  listingId: string
): Promise<ListingSeller | null> {
  const { data, error } = await client.rpc('listing_seller', { p_listing_id: listingId });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ListingSeller[];
  return rows[0] ?? null;
}
