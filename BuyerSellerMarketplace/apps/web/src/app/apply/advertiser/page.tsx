'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AD_PLACEMENTS,
  AD_PLACEMENT_LABELS,
  advertiserApplicationSchema,
  submitAdvertiserApplication,
  type AdPlacement,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdvertiserApplicationPage() {
  const router = useRouter();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [motivation, setMotivation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const parsed = advertiserApplicationSchema.safeParse({
      contact_name: contactName,
      contact_email: contactEmail,
      company_name: companyName,
      website,
      placements,
      motivation,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form.');
      setBusy(false);
      return;
    }

    try {
      await submitAdvertiserApplication(getSupabaseBrowserClient(), parsed.data);
      router.push('/apply');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Apply to advertise</h1>
      <p className="mt-1 text-sm text-slate-600">
        Advertisers reach members through placements. You cannot browse or message sellers and
        buyers — a lead only exists once somebody clicks through.
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
            Company
            <input
              required
              maxLength={200}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Website
            <input
              required
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="example.com"
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">Where you want to appear</legend>
          <div className="flex flex-wrap gap-2">
            {AD_PLACEMENTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  setPlacements((prev) =>
                    prev.includes(p) ? prev.filter((v) => v !== p) : [...prev, p]
                  )
                }
                aria-pressed={placements.includes(p)}
                className={`min-h-[40px] rounded-lg border px-3 text-sm ${
                  placements.includes(p)
                    ? 'border-brand bg-surface font-semibold text-brand-dark'
                    : 'border-slate-300'
                }`}
              >
                {AD_PLACEMENT_LABELS[p]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          What do you offer our members?
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
