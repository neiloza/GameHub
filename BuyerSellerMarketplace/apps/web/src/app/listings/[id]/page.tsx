'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CATEGORY_LABELS,
  deleteListing,
  formatCents,
  getListing,
  getPendingMatches,
  LISTING_STAGE_LABELS,
  setListingPublished,
  type Listing,
  type Match,
} from '@marketplace/shared';
import { SponsorSlot } from '@/components/SponsorSlot';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [pending, setPending] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getListing(supabase, id), getPendingMatches(supabase, id)])
      .then(([l, m]) => {
        setListing(l);
        setPending(m);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function togglePublished() {
    if (!listing) return;
    setBusy(true);
    try {
      setListing(
        await setListingPublished(
          getSupabaseBrowserClient(),
          listing.id,
          listing.status !== 'published'
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!listing) return;
    // Deleting takes the conversations with it, so it is worth a pause.
    if (!confirm('Delete this listing? Conversations about it go too.')) return;
    await deleteListing(getSupabaseBrowserClient(), listing.id);
    router.push('/listings');
    router.refresh();
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;
  if (!listing) return <p className="py-16 text-center text-sm text-slate-500">Not found.</p>;

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{listing.name}</h1>
          {listing.tagline && <p className="mt-1 text-slate-600">{listing.tagline}</p>}
          <p className="mt-2 text-xs text-slate-500">
            {CATEGORY_LABELS[listing.category]} · {LISTING_STAGE_LABELS[listing.stage]}
            {listing.location ? ` · ${listing.location}` : ''}
            {listing.price_cents != null ? ` · ${formatCents(listing.price_cents)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/listings/${listing.id}/edit`}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
          >
            Edit
          </Link>
          {listing.status !== 'suspended' && (
            <button
              type="button"
              onClick={togglePublished}
              disabled={busy}
              className="inline-flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {listing.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {listing.status === 'suspended' && (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          An administrator suspended this listing. It is not visible to anyone, and only an
          administrator can bring it back.
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-6">
          {listing.summary && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold text-brand-dark">Summary</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{listing.summary}</p>
            </section>
          )}

          {listing.details && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold text-brand-dark">The detail</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{listing.details}</p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-brand-dark">Interested buyers</h2>
              {pending.length > 0 && (
                <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
                  {pending.length} waiting
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              A buyer expressing interest does not open a chat. You decide.
            </p>
            <Link
              href={`/listings/${listing.id}/buyers`}
              className="mt-4 inline-flex h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
            >
              Open
            </Link>
          </section>
        </div>

        <aside className="grid gap-4">
          <SponsorSlot placement="listing_detail" />
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete this listing
          </button>
        </aside>
      </div>
    </div>
  );
}
