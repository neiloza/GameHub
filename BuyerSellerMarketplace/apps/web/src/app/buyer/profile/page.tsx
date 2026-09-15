'use client';

import { useEffect, useState } from 'react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  getMyBuyerPreferences,
  LISTING_STAGES,
  LISTING_STAGE_LABELS,
  upsertBuyerPreferences,
  type Category,
  type ListingStage,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * What a buyer is looking for.
 *
 * These *rank* the feed rather than filter it — a strong listing outside the
 * stated range still reaches them, just further down. Saying so on the page
 * matters: a buyer who thinks these are filters will state them far too
 * narrowly and then wonder why the deck is empty.
 */
export default function BuyerProfilePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<ListingStage[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [locations, setLocations] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyBuyerPreferences(getSupabaseBrowserClient())
      .then((p) => {
        if (!p) return;
        setCategories(p.categories);
        setStages(p.stages);
        setMin(p.budget_min_cents != null ? String(p.budget_min_cents / 100) : '');
        setMax(p.budget_max_cents != null ? String(p.budget_max_cents / 100) : '');
        setLocations(p.locations.join(', '));
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle<T>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await upsertBuyerPreferences(getSupabaseBrowserClient(), {
        categories,
        stages,
        budget_min_cents: min.trim() === '' ? null : Math.round(Number(min) * 100),
        budget_max_cents: max.trim() === '' ? null : Math.round(Number(max) * 100),
        locations: locations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        notes: null,
      });
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">What are you looking for?</h1>
      <p className="mt-1 text-sm text-slate-600">
        These rank your feed rather than filter it — a strong listing outside what you name here
        still reaches you, just further down.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-6 rounded-xl border border-slate-200 bg-white p-6">
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">Categories</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle(categories, c, setCategories)}
                aria-pressed={categories.includes(c)}
                className={`min-h-[40px] rounded-lg border px-3 text-sm ${
                  categories.includes(c)
                    ? 'border-brand bg-surface font-semibold text-brand-dark'
                    : 'border-slate-300'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">Stage</legend>
          <div className="flex flex-wrap gap-2">
            {LISTING_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggle(stages, s, setStages)}
                aria-pressed={stages.includes(s)}
                className={`min-h-[40px] rounded-lg border px-3 text-sm ${
                  stages.includes(s)
                    ? 'border-brand bg-surface font-semibold text-brand-dark'
                    : 'border-slate-300'
                }`}
              >
                {LISTING_STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Budget from
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Budget to
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Places <span className="font-normal text-slate-400">(comma separated)</span>
          <input
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="Austin, Portland"
            className="h-11 rounded-lg border border-slate-300 px-3"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-accent">Saved.</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
