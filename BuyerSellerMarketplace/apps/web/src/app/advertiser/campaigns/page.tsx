'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AD_PLACEMENTS,
  AD_PLACEMENT_LABELS,
  campaignSchema,
  createCampaign,
  type AdPlacement,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewCampaignPage() {
  const router = useRouter();
  const [placement, setPlacement] = useState<AdPlacement>(AD_PLACEMENTS[0]);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [destination, setDestination] = useState('');
  const [startsOn, setStartsOn] = useState(today());
  const [endsOn, setEndsOn] = useState(today());
  const [budget, setBudget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const parsed = campaignSchema.safeParse({
      placement,
      headline,
      body,
      destination_url: destination,
      image_url: null,
      starts_on: startsOn,
      ends_on: endsOn,
      budget_cents: Math.round(Number(budget || '0') * 100),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form.');
      setBusy(false);
      return;
    }

    try {
      await createCampaign(getSupabaseBrowserClient(), parsed.data);
      router.push('/advertiser');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">New campaign</h1>
      <p className="mt-1 text-sm text-slate-600">
        Submitted for review. An administrator approves it before it goes live — you can pause it
        yourself at any time afterwards.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-5 rounded-xl border border-slate-200 bg-white p-6">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Where
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as AdPlacement)}
            className="h-11 rounded-lg border border-slate-300 px-3"
          >
            {AD_PLACEMENTS.map((p) => (
              <option key={p} value={p}>
                {AD_PLACEMENT_LABELS[p]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Headline
          <input
            required
            maxLength={80}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="h-11 rounded-lg border border-slate-300 px-3"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Body
          <textarea
            required
            rows={3}
            maxLength={240}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-lg border border-slate-300 p-3"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Where the click goes
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="example.com/offer"
            className="h-11 rounded-lg border border-slate-300 px-3"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Starts
            <input
              type="date"
              required
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Ends
            <input
              type="date"
              required
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Budget
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}
