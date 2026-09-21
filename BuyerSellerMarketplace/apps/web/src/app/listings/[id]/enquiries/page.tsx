'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getListing,
  getListingEnquiries,
  getProfile,
  type Conversation,
  type Listing,
  type Profile,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/** Everybody who has asked about one listing. The seller's side of the inbox. */
export default function ListingEnquiriesPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [buyers, setBuyers] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getListing(supabase, id), getListingEnquiries(supabase, id)])
      .then(async ([l, rows]) => {
        setListing(l);
        setThreads(rows);
        // One read per distinct shopper rather than one per thread.
        const ids = [...new Set(rows.map((r) => r.buyer_id))];
        const profiles = await Promise.all(ids.map((pid) => getProfile(supabase, pid)));
        setBuyers(
          Object.fromEntries(profiles.filter((p): p is Profile => p !== null).map((p) => [p.id, p]))
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  return (
    <div className="py-8">
      <Link href={`/listings/${id}`} className="text-sm font-medium text-brand">
        ← Back to {listing?.name ?? 'the listing'}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">Enquiries</h1>

      {threads.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-brand-dark">Nobody has asked yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Questions arrive here when a shopper uses the form on your listing.
            {listing?.status !== 'published' &&
              ' This listing is not published, so nobody can see it to ask.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {threads.map((t) => {
            const buyer = buyers[t.buyer_id];
            return (
              <li key={t.id}>
                <Link
                  href={`/listings/${id}/enquiries/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:border-brand"
                >
                  <div>
                    <p className="font-semibold text-brand-dark">
                      {buyer?.display_name ?? 'A shopper'}
                      {buyer?.verified && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                          Verified
                        </span>
                      )}
                    </p>
                    {buyer?.location && <p className="text-xs text-slate-500">{buyer.location}</p>}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
