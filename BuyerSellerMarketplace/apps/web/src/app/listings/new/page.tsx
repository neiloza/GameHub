'use client';

import { useRouter } from 'next/navigation';
import { createListing } from '@marketplace/shared';
import { ListingForm } from '@/components/ListingForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function NewListingPage() {
  const router = useRouter();

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">New listing</h1>
      <p className="mt-1 text-sm text-slate-600">
        Saved as a draft. Nobody sees it until you publish.
      </p>
      <ListingForm
        submitLabel="Create listing"
        onSubmit={async (input) => {
          const listing = await createListing(getSupabaseBrowserClient(), input);
          router.push(`/listings/${listing.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
