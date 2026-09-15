'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CATEGORY_LABELS,
  explainScore,
  formatCents,
  getDiscoveryFeed,
  getMyBuyerPreferences,
  LISTING_STAGE_LABELS,
  scoreListing,
  swipe,
  type BuyerProfile,
  type ScoredListing,
} from '@marketplace/shared';
import { SponsorSlot } from '@/components/SponsorSlot';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * The buyer's deck.
 *
 * One listing at a time, ranked by the database. Expressing interest does not
 * open a chat — it sends a request the seller answers — and saying so on the
 * button is the difference between a buyer who waits and a buyer who thinks the
 * app is broken.
 */
export default function DiscoverPage() {
  const [queue, setQueue] = useState<ScoredListing[]>([]);
  const [prefs, setPrefs] = useState<BuyerProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const [feed, preferences] = await Promise.all([
      getDiscoveryFeed(supabase, { limit: 20 }),
      getMyBuyerPreferences(supabase),
    ]);
    setQueue(feed);
    setPrefs(preferences);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const current = queue[0];

  async function answer(direction: 'interested' | 'pass') {
    if (!current) return;
    setBusy(true);
    try {
      await swipe(getSupabaseBrowserClient(), { listing_id: current.id, direction });
      setQueue((q) => q.slice(1));
      // Top up before the deck runs dry, so there is no empty beat between the
      // last card of one page and the first of the next.
      if (queue.length <= 3) void load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  if (!current) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-brand-dark">That is everything for now</p>
        <p className="mt-2 text-sm text-slate-600">
          New listings appear here as sellers publish them. Widening your preferences brings more in.
        </p>
        <a
          href="/buyer/profile"
          className="mt-6 inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium hover:bg-surface"
        >
          Adjust what you are looking for
        </a>
      </div>
    );
  }

  const reasons = explainScore(
    scoreListing(
      prefs
        ? {
            categories: prefs.categories,
            stages: prefs.stages,
            budget_min_cents: prefs.budget_min_cents,
            budget_max_cents: prefs.budget_max_cents,
            locations: prefs.locations,
          }
        : null,
      current
    )
  );

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Discover</h1>

      <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-brand-dark">{current.name}</h2>
        {current.tagline && <p className="mt-1 text-slate-600">{current.tagline}</p>}

        <p className="mt-3 text-xs text-slate-500">
          {CATEGORY_LABELS[current.category]} · {LISTING_STAGE_LABELS[current.stage]}
          {current.location ? ` · ${current.location}` : ''}
          {current.price_cents != null ? ` · ${formatCents(current.price_cents)}` : ''}
        </p>

        {reasons.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {reasons.map((r) => (
              <li
                key={r}
                className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
              >
                {r}
              </li>
            ))}
          </ul>
        )}

        {current.summary && (
          <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{current.summary}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => answer('pass')}
            className="h-12 flex-1 rounded-lg border border-slate-300 font-medium hover:bg-surface disabled:opacity-50"
          >
            Pass
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => answer('interested')}
            className="h-12 flex-1 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            I am interested
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          This sends a request. The seller decides whether a conversation opens.
        </p>
      </article>

      <div className="mt-8">
        <SponsorSlot placement="discovery_feed" />
      </div>
    </div>
  );
}
