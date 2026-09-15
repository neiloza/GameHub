'use client';

import { useEffect, useState } from 'react';
import {
  AD_PLACEMENT_LABELS,
  approveCampaign,
  formatCents,
  listAllCampaigns,
  setAdvertiserListed,
  type AdCampaign,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminAdsPage() {
  const [rows, setRows] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllCampaigns(getSupabaseBrowserClient())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  async function approve(campaign: AdCampaign) {
    setError(null);
    try {
      const updated = await approveCampaign(getSupabaseBrowserClient(), campaign.id);
      setRows((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function list(campaign: AdCampaign, listed: boolean) {
    setError(null);
    try {
      await setAdvertiserListed(getSupabaseBrowserClient(), campaign.advertiser_id, listed);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">One moment…</p>;

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No campaigns.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div>
                <p className="font-semibold text-brand-dark">{c.headline}</p>
                <p className="mt-0.5 text-sm text-slate-600">{c.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {AD_PLACEMENT_LABELS[c.placement]} · {c.starts_on} → {c.ends_on} ·{' '}
                  {formatCents(c.budget_cents)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {c.status}
                </span>
                {c.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => void approve(c)}
                    className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void list(c, true)}
                  className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
                >
                  List in directory
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
