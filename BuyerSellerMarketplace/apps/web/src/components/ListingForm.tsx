'use client';

import { useState } from 'react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  LISTING_CONDITIONS,
  LISTING_CONDITION_LABELS,
  listingSchema,
  type Listing,
  type ListingInput,
} from '@marketplace/shared';

/**
 * The one form a listing is created and edited through.
 *
 * Validation is `listingSchema` from the shared package, the same schema the
 * API layer parses with — so the message a member reads here is the message the
 * write would have produced, rather than a second set of rules that drifts.
 * `status` is deliberately not a field: publishing is a button on the listing
 * page, and `suspended` belongs to an administrator.
 */
export function ListingForm({
  listing,
  submitLabel,
  onSubmit,
}: {
  listing?: Listing;
  submitLabel: string;
  onSubmit: (input: ListingInput) => Promise<void>;
}) {
  const [values, setValues] = useState({
    name: listing?.name ?? '',
    tagline: listing?.tagline ?? '',
    category: listing?.category ?? CATEGORIES[0],
    condition: listing?.condition ?? LISTING_CONDITIONS[0],
    location: listing?.location ?? '',
    summary: listing?.summary ?? '',
    details: listing?.details ?? '',
    website: listing?.website ?? '',
    // Held as strings: a number input bound to a number makes clearing the
    // field produce NaN, and the member sees "NaN" where their price was.
    price: listing ? String(listing.price_cents / 100) : '',
    stock: listing?.stock_quantity != null ? String(listing.stock_quantity) : '',
  });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});

    // Money is integer cents everywhere. Rounding happens once, here, at the
    // boundary between what a person typed and what the database stores.
    const price = values.price.trim();
    const stock = values.stock.trim();
    const parsed = listingSchema.safeParse({
      name: values.name,
      tagline: values.tagline || null,
      category: values.category,
      condition: values.condition,
      location: values.location || null,
      summary: values.summary || null,
      details: values.details || null,
      website: values.website || null,
      // An empty box means "not priced yet", which the schema refuses — NaN
      // would produce an unreadable zod message, so send undefined and let the
      // required-field error speak.
      price_cents: price === '' ? undefined : Math.round(Number(price) * 100),
      currency: listing?.currency ?? 'USD',
      // Empty is "not tracked", which is different from zero. See the schema.
      stock_quantity: stock === '' ? null : Math.round(Number(stock)),
      status: listing?.status === 'published' ? 'published' : 'draft',
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        next[key] ??= issue.message;
      }
      setErrors(next);
      setBusy(false);
      return;
    }

    try {
      await onSubmit(parsed.data);
    } catch (e) {
      setErrors({ form: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    'h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none';

  return (
    <form onSubmit={submit} className="mt-6 grid gap-5 rounded-xl border border-slate-200 bg-white p-6">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Name
        <input
          required
          maxLength={80}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          className={fieldClass}
        />
        {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        One line <span className="font-normal text-slate-400">(optional)</span>
        <input
          maxLength={140}
          value={values.tagline}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="The thing a buyer needs to know first"
          className={fieldClass}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Category
          <select
            value={values.category}
            onChange={(e) => set('category', e.target.value as (typeof CATEGORIES)[number])}
            className={fieldClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Condition
          <select
            value={values.condition}
            onChange={(e) => set('condition', e.target.value as (typeof LISTING_CONDITIONS)[number])}
            className={fieldClass}
          >
            {LISTING_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {LISTING_CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Location <span className="font-normal text-slate-400">(optional)</span>
          <input
            maxLength={120}
            value={values.location}
            onChange={(e) => set('location', e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Price
          <input
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            className={fieldClass}
          />
          {errors.price_cents && (
            <span className="text-xs text-red-600">{errors.price_cents}</span>
          )}
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        How many <span className="font-normal text-slate-400">(leave empty if you do not count them)</span>
        <input
          type="number"
          min={0}
          step="1"
          inputMode="numeric"
          value={values.stock}
          onChange={(e) => set('stock', e.target.value)}
          className={fieldClass}
        />
        <span className="text-xs text-slate-500">
          Empty means made to order, a service, or something you never run out of. Zero means you
          are tracking stock and it has sold out — the shop says so.
        </span>
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Website <span className="font-normal text-slate-400">(optional)</span>
        <input
          value={values.website}
          onChange={(e) => set('website', e.target.value)}
          placeholder="example.com"
          className={fieldClass}
        />
        {errors.website && <span className="text-xs text-red-600">{errors.website}</span>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Summary <span className="font-normal text-slate-400">(optional)</span>
        <textarea
          rows={3}
          maxLength={4000}
          value={values.summary}
          onChange={(e) => set('summary', e.target.value)}
          className="rounded-lg border border-slate-300 p-3 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        The detail <span className="font-normal text-slate-400">(optional)</span>
        <textarea
          rows={8}
          maxLength={8000}
          value={values.details}
          onChange={(e) => set('details', e.target.value)}
          className="rounded-lg border border-slate-300 p-3 focus:border-brand focus:outline-none"
        />
      </label>

      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
