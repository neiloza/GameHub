'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getListing, updateListing, type Listing } from '@marketplace/shared';
import { ListingForm } from '@/components/ListingForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListing(getSupabaseBrowserClient(), id)
      .then(setListing)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;
  if (!listing) return <p className="py-16 text-center text-sm text-slate-500">Not found.</p>;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Edit listing</h1>
      <ListingForm
        listing={listing}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await updateListing(getSupabaseBrowserClient(), listing.id, input);
          router.push(`/listings/${listing.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
