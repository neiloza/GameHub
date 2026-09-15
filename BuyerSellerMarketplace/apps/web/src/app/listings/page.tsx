'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  canAddListing,
  CATEGORY_LABELS,
  getMyListings,
  getMyMembership,
  LISTING_STAGE_LABELS,
  type Listing,
  type Membership,
} from '@marketplace/shared';
import { MembershipGate } from '@/components/MembershipGate';
import { SponsorSlot } from '@/components/SponsorSlot';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getMyListings(supabase), getMyMembership(supabase)])
      .then(([rows, m]) => {
        setListings(rows);
        setMembership(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const canAdd = canAddListing(membership, listings.length);

  return (
    <div className="py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">My listings</h1>
        {canAdd.allowed && (
          <Link
            href="/listings/new"
            className="inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
          >
            New listing
          </Link>
        )}
      </header>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">One moment…</p>
      ) : (
        <>
          {listings.length === 0 && canAdd.allowed && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-semibold text-brand-dark">Nothing listed yet</p>
              <p className="mt-1 text-sm text-slate-600">
                A listing is what buyers discover, and every conversation is scoped to one.
              </p>
              <Link
                href="/listings/new"
                className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white"
              >
                Create your first
              </Link>
            </div>
          )}

          {!canAdd.allowed && canAdd.reason === 'membership_required' && (
            <div className="mt-8">
              <MembershipGate
                membership={membership}
                reason="A membership is what lets you hold a listing."
              >
                <span />
              </MembershipGate>
            </div>
          )}

          <ul className="mt-6 grid gap-4">
            {listings.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-brand"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-brand-dark">{listing.name}</h2>
                      {listing.tagline && (
                        <p className="mt-0.5 text-sm text-slate-600">{listing.tagline}</p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        listing.status === 'published'
                          ? 'bg-accent/10 text-accent'
                          : listing.status === 'suspended'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {CATEGORY_LABELS[listing.category]} · {LISTING_STAGE_LABELS[listing.stage]}
                    {listing.location ? ` · ${listing.location}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {!canAdd.allowed && canAdd.reason === 'cap_reached' && (
            <p className="mt-6 text-sm text-slate-500">
              You are holding the maximum number of listings. Archive one to add another.
            </p>
          )}

          <div className="mt-10">
            <SponsorSlot placement="dashboard" />
          </div>
        </>
      )}
    </div>
  );
}
