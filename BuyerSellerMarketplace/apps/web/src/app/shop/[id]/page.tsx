'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CATEGORY_LABELS,
  LISTING_CONDITION_LABELS,
  formatCents,
  getListing,
  getListingSeller,
  type Listing,
  type ListingSeller,
} from '@marketplace/shared';
import { EnquiryForm } from '@/components/EnquiryForm';
import { SponsorSlot } from '@/components/SponsorSlot';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * A product page, readable by anybody.
 *
 * No auth check and no role guard: published listings are readable by `anon` in
 * RLS, and a stranger arriving from a search engine is the point. The only part
 * that needs an account is the enquiry form, which says so itself.
 */
export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<ListingSeller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getListing(supabase, id), getListingSeller(supabase, id).catch(() => null)])
      .then(([l, s]) => {
        setListing(l);
        setSeller(s);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  if (!listing) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold text-brand-dark">That listing is not here</p>
        <p className="mt-1 text-sm text-slate-600">
          It may have sold, or been taken down by whoever listed it.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  const soldOut = listing.stock_quantity === 0;

  return (
    <div className="py-8">
      <Link href="/shop" className="text-sm font-medium text-brand">
        ← Back to the shop
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {listing.cover_image_url && (
            <img
              src={listing.cover_image_url}
              alt={listing.name}
              className="mb-6 aspect-[4/3] w-full rounded-xl object-cover"
            />
          )}

          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{listing.name}</h1>
          {listing.tagline && <p className="mt-1 text-lg text-slate-600">{listing.tagline}</p>}

          <p className="mt-4 text-xs text-slate-500">
            {CATEGORY_LABELS[listing.category]} · {LISTING_CONDITION_LABELS[listing.condition]}
            {listing.location ? ` · ${listing.location}` : ''}
          </p>

          {listing.summary && (
            <p className="mt-6 whitespace-pre-line text-slate-700">{listing.summary}</p>
          )}

          {listing.details && (
            <section className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="font-bold text-brand-dark">Details</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{listing.details}</p>
            </section>
          )}

          {listing.website && (
            <p className="mt-6 text-sm">
              <a
                href={listing.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-medium text-brand"
              >
                More about this →
              </a>
            </p>
          )}
        </div>

        <aside className="grid h-fit gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-3xl font-extrabold text-ink">
              {formatCents(listing.price_cents, listing.currency)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {listing.stock_quantity == null
                ? LISTING_CONDITION_LABELS[listing.condition] === 'Made to order'
                  ? 'Made to order'
                  : 'Available'
                : soldOut
                  ? 'Sold out'
                  : `${listing.stock_quantity} available`}
            </p>

            {seller && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sold by
                </p>
                <p className="mt-1 font-semibold text-brand-dark">
                  {seller.display_name}
                  {seller.verified && (
                    <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      Verified
                    </span>
                  )}
                </p>
                {seller.location && (
                  <p className="text-xs text-slate-500">{seller.location}</p>
                )}
              </div>
            )}
          </div>

          <EnquiryForm listingId={listing.id} sellerId={seller?.id ?? null} />

          <SponsorSlot placement="listing_detail" />
        </aside>
      </div>
    </div>
  );
}
