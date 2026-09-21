import Link from 'next/link';
import {
  CATEGORY_LABELS,
  LISTING_CONDITION_LABELS,
  formatCents,
  type Listing,
} from '@marketplace/shared';

/** One tile in the catalogue grid. */
export function ListingCard({ listing }: { listing: Listing }) {
  const soldOut = listing.stock_quantity === 0;

  return (
    <Link
      href={`/shop/${listing.id}`}
      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 hover:border-brand"
    >
      {listing.cover_image_url && (
        // A plain <img>: these URLs are member-uploaded and point at a storage
        // bucket, which next/image would need a per-domain allowlist for.
        <img
          src={listing.cover_image_url}
          alt=""
          className="mb-4 aspect-[4/3] w-full rounded-lg object-cover"
          loading="lazy"
        />
      )}

      <h2 className="font-bold text-brand-dark">{listing.name}</h2>
      {listing.tagline && <p className="mt-0.5 text-sm text-slate-600">{listing.tagline}</p>}

      <p className="mt-3 text-lg font-extrabold text-ink">
        {formatCents(listing.price_cents, listing.currency)}
      </p>

      <p className="mt-auto pt-3 text-xs text-slate-500">
        {CATEGORY_LABELS[listing.category]} · {LISTING_CONDITION_LABELS[listing.condition]}
        {listing.location ? ` · ${listing.location}` : ''}
      </p>

      {soldOut && (
        <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          Sold out
        </p>
      )}
    </Link>
  );
}
