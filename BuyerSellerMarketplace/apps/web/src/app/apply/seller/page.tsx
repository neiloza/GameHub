'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  SELLER_TYPES,
  SELLER_TYPE_LABELS,
  sellerApplicationSchema,
  submitSellerApplication,
  type Category,
  type SellerType,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SellerApplicationPage() {
  const router = useRouter();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [website, setWebsite] = useState('');
  const [sellerType, setSellerType] = useState<SellerType>('individual');
  const [categories, setCategories] = useState<Category[]>([]);
  const [fulfilment, setFulfilment] = useState('');
  const [motivation, setMotivation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const parsed = sellerApplicationSchema.safeParse({
      contact_name: contactName,
      contact_email: contactEmail,
      website: website || null,
      motivation,
      shop_name: shopName,
      seller_type: sellerType,
      categories,
      fulfilment_note: fulfilment || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form.');
      setBusy(false);
      return;
    }

    try {
      await submitSellerApplication(getSupabaseBrowserClient(), parsed.data);
      router.push('/apply');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Open a shop</h1>
      <p className="mt-1 text-sm text-slate-600">
        Buying needs no application — you can already do that. Selling is reviewed by a person,
        because a shop is answerable for what is on its shelves. You keep your buying account
        either way.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Your name
            <input
              required
              maxLength={120}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Contact email
            <input
              type="email"
              required
              maxLength={200}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Shop name
            <input
              required
              maxLength={120}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="What buyers will see above your listings"
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            You are
            <select
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value as SellerType)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            >
              {SELLER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SELLER_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Website <span className="font-normal text-slate-400">(optional)</span>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="example.com"
            className="h-11 rounded-lg border border-slate-300 px-3"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">What will you be selling?</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setCategories((prev) =>
                    prev.includes(c) ? prev.filter((v) => v !== c) : [...prev, c]
                  )
                }
                aria-pressed={categories.includes(c)}
                className={`min-h-[40px] rounded-lg border px-3 text-sm ${
                  categories.includes(c)
                    ? 'border-brand bg-surface font-semibold text-brand-dark'
                    : 'border-slate-300'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          How will you fulfil orders?{' '}
          <span className="font-normal text-slate-400">(optional)</span>
          <textarea
            rows={3}
            maxLength={2000}
            value={fulfilment}
            onChange={(e) => setFulfilment(e.target.value)}
            placeholder="Roughly how much, how often, and how it reaches the buyer"
            className="rounded-lg border border-slate-300 p-3"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Tell us about your shop
          <textarea
            required
            rows={5}
            maxLength={4000}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="rounded-lg border border-slate-300 p-3"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
