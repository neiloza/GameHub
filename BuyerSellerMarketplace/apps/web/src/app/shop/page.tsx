'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  CATALOGUE_SORTS,
  CATALOGUE_SORT_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  LISTING_CONDITIONS,
  LISTING_CONDITION_LABELS,
  searchCatalogue,
  type CatalogueSort,
  type CataloguePage,
  type Category,
  type ListingCondition,
} from '@marketplace/shared';
import { ListingCard } from '@/components/ListingCard';
import { SponsorSlot } from '@/components/SponsorSlot';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * The catalogue.
 *
 * Every filter lives in the query string rather than in component state, so a
 * search is a URL: it can be linked, bookmarked, shared, and reached with the
 * back button. That is worth the small amount of plumbing — a shop where the
 * back button loses your filters is a shop people stop using.
 */
function Shop() {
  const router = useRouter();
  const params = useSearchParams();

  const [result, setResult] = useState<CataloguePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The search box is local state so typing does not push a history entry per
  // keystroke; it commits to the URL on submit.
  const [draft, setDraft] = useState(params.get('q') ?? '');

  const query = params.get('q') ?? undefined;
  const category = (params.get('category') as Category | null) ?? undefined;
  const condition = (params.get('condition') as ListingCondition | null) ?? undefined;
  const sort = (params.get('sort') as CatalogueSort | null) ?? 'newest';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  /** Rewrite the query string, resetting to page 1 whenever a filter changes. */
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      router.push(`/shop?${next.toString()}`);
    },
    [params, router]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchCatalogue(getSupabaseBrowserClient(), { query, category, condition, sort, page })
      .then((r) => !cancelled && setResult(r))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, category, condition, sort, page]);

  const selectClass = 'h-11 rounded-lg border border-slate-300 px-3 text-sm';

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Shop</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam('q', draft.trim() || null);
        }}
        className="mt-6 flex gap-2"
        role="search"
      >
        <label className="sr-only" htmlFor="q">
          Search
        </label>
        <input
          id="q"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search everything"
          className="h-11 flex-1 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          value={category ?? ''}
          onChange={(e) => setParam('category', e.target.value || null)}
          className={selectClass}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="condition">
          Condition
        </label>
        <select
          id="condition"
          value={condition ?? ''}
          onChange={(e) => setParam('condition', e.target.value || null)}
          className={selectClass}
        >
          <option value="">Any condition</option>
          {LISTING_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {LISTING_CONDITION_LABELS[c]}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="sort">
          Sort
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className={selectClass}
        >
          {CATALOGUE_SORTS.map((s) => (
            <option key={s} value={s}>
              {CATALOGUE_SORT_LABELS[s]}
            </option>
          ))}
        </select>

        {(query || category || condition) && (
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
          >
            Clear
          </Link>
        )}
      </div>

      {/* aria-live so a screen reader hears the result count change when a
          filter is applied — the visual change is obvious, the announcement is
          not automatic. */}
      <p aria-live="polite" className="mt-4 text-sm text-slate-500">
        {loading
          ? 'Searching…'
          : result
            ? `${result.total} ${result.total === 1 ? 'listing' : 'listings'}`
            : ''}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && result && result.listings.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-brand-dark">Nothing matches that</p>
          <p className="mt-1 text-sm text-slate-600">
            Try fewer words, or clear the filters and browse everything.
          </p>
        </div>
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result?.listings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>

      {result && result.pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setParam('page', String(page - 1))}
            className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {result.pageCount}
          </span>
          <button
            type="button"
            disabled={page >= result.pageCount}
            onClick={() => setParam('page', String(page + 1))}
            className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}

      <div className="mt-10">
        <SponsorSlot placement="catalogue" />
      </div>
    </div>
  );
}

export default function ShopPage() {
  // Reading the query string needs a Suspense boundary under the App Router.
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-slate-500">One moment…</p>}>
      <Shop />
    </Suspense>
  );
}
