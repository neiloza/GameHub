'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  advertiserProfileSchema,
  getCampaignCounts,
  getMyAdvertiser,
  getMyCampaigns,
  setCampaignPaused,
  upsertMyAdvertiser,
  AD_PLACEMENT_LABELS,
  formatCents,
  type AdCampaign,
  type Advertiser,
  type CampaignCounts,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdvertiserPage() {
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [counts, setCounts] = useState<Record<string, CampaignCounts>>({});
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState('');
  const [blurb, setBlurb] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getMyAdvertiser(supabase), getMyCampaigns(supabase)])
      .then(async ([a, c]) => {
        setAdvertiser(a);
        setCampaigns(c);
        if (a) {
          setCompanyName(a.company_name);
          setBlurb(a.blurb);
          setWebsite(a.website);
        }
        const entries = await Promise.all(
          c.map(async (campaign) => [campaign.id, await getCampaignCounts(supabase, campaign.id)] as const)
        );
        setCounts(Object.fromEntries(entries));
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const parsed = advertiserProfileSchema.safeParse({
      company_name: companyName,
      blurb,
      website,
      logo_url: advertiser?.logo_url ?? null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form.');
      setBusy(false);
      return;
    }

    try {
      setAdvertiser(await upsertMyAdvertiser(getSupabaseBrowserClient(), parsed.data));
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePause(campaign: AdCampaign) {
    const updated = await setCampaignPaused(
      getSupabaseBrowserClient(),
      campaign.id,
      campaign.status === 'active'
    );
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Your listing</h1>
      <p className="mt-1 text-sm text-slate-600">
        This is what appears in every slot you buy. Editing it updates every live placement at once.
      </p>

      <form onSubmit={save} className="mt-6 grid gap-5 rounded-xl border border-slate-200 bg-white p-6">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Company name
          <input
            required
            maxLength={200}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-11 rounded-lg border border-slate-300 px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          What you offer
          <textarea
            required
            rows={3}
            maxLength={400}
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            className="rounded-lg border border-slate-300 p-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Website
          <input
            required
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="example.com"
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

      {advertiser && !advertiser.listed && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          You are not in the public directory yet. An administrator decides who is listed — paying
          for a placement and being vouched for are deliberately different things.
        </p>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-brand-dark">Campaigns</h2>
          <Link
            href="/advertiser/campaigns"
            className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            New campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nothing running yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {campaigns.map((c) => {
              const count = counts[c.id];
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    <p className="font-semibold text-brand-dark">{c.headline}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {AD_PLACEMENT_LABELS[c.placement]} · {c.starts_on} → {c.ends_on} ·{' '}
                      {formatCents(c.budget_cents)}
                    </p>
                    {count && (
                      <p className="mt-1 text-xs text-slate-500">
                        {count.impressions} impressions · {count.clicks} clicks
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {c.status}
                    </span>
                    {(c.status === 'active' || c.status === 'paused') && (
                      <button
                        type="button"
                        onClick={() => void togglePause(c)}
                        className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
                      >
                        {c.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
