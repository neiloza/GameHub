'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getActiveCampaigns,
  recordAdEvent,
  type AdCampaign,
  type AdPlacement,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * One advertising slot.
 *
 * The placement is a contract between this component and the campaign rows: the
 * component asks for a placement by name and the query filters on it. Nothing
 * is inferred, and a placement nothing renders simply never sells.
 *
 * Renders nothing at all when there is no live campaign — no placeholder, no
 * empty box. A slot that reserves space it has nothing to put in is a hole in
 * the page on every screen that has not sold yet.
 */
export function SponsorSlot({ placement }: { placement: AdPlacement }) {
  const [campaign, setCampaign] = useState<AdCampaign | null>(null);
  // An impression is recorded once per mount. Without the ref, a re-render
  // from any parent state change would count another one.
  const counted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getActiveCampaigns(getSupabaseBrowserClient(), placement, 1)
      .then((rows) => !cancelled && setCampaign(rows[0] ?? null))
      // An ad that fails to load is not worth an error anywhere.
      .catch(() => !cancelled && setCampaign(null));
    return () => {
      cancelled = true;
    };
  }, [placement]);

  useEffect(() => {
    if (!campaign || counted.current) return;
    counted.current = true;
    void recordAdEvent(getSupabaseBrowserClient(), campaign.id, 'impression');
  }, [campaign]);

  if (!campaign) return null;

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4" aria-label="Advertisement">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sponsored</p>
      <a
        href={campaign.destination_url}
        target="_blank"
        // noopener stops the destination reaching back through window.opener;
        // noreferrer stops it learning which page the click came from.
        rel="noopener noreferrer nofollow sponsored"
        onClick={() => void recordAdEvent(getSupabaseBrowserClient(), campaign.id, 'click')}
        className="mt-1 block"
      >
        <p className="font-semibold text-brand-dark">{campaign.headline}</p>
        <p className="mt-1 text-sm text-slate-600">{campaign.body}</p>
      </a>
    </aside>
  );
}
