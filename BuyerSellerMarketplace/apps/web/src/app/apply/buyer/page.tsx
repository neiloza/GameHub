'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BUYER_TYPES,
  CATEGORIES,
  CATEGORY_LABELS,
  buyerApplicationSchema,
  submitBuyerApplication,
  type BuyerType,
  type Category,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const TYPE_LABELS: Record<BuyerType, string> = {
  individual: 'An individual',
  business: 'A business',
  institution: 'An institution',
  intermediary: 'Acting for somebody else',
  other: 'Something else',
};

export default function BuyerApplicationPage() {
  const router = useRouter();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [website, setWebsite] = useState('');
  const [buyerType, setBuyerType] = useState<BuyerType>('individual');
  const [categories, setCategories] = useState<Category[]>([]);
  const [motivation, setMotivation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const parsed = buyerApplicationSchema.safeParse({
      contact_name: contactName,
      contact_email: contactEmail,
      website: website || null,
      motivation,
      buyer_type: buyerType,
      organization: organization || null,
      categories,
      budget_min_cents: null,
      budget_max_cents: null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form.');
      setBusy(false);
      return;
    }

    try {
      await submitBuyerApplication(getSupabaseBrowserClient(), parsed.data);
      router.push('/apply');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Apply as a buyer</h1>
      <p className="mt-1 text-sm text-slate-600">
        Sellers are told every buyer who reaches them has been reviewed by a person. This is that
        review.
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

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          You are
          <select
            value={buyerType}
            onChange={(e) => setBuyerType(e.target.value as BuyerType)}
            className="h-11 rounded-lg border border-slate-300 px-3"
          >
            {BUYER_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Organisation <span className="font-normal text-slate-400">(optional)</span>
            <input
              maxLength={200}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Website <span className="font-normal text-slate-400">(optional)</span>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="example.com"
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">What interests you?</legend>
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
          What are you looking for, and why here?
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
