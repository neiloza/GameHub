'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ESTIMATED_MONTHLY_REFERRALS,
  PROMOTER_PLATFORMS,
  PROMOTER_TYPES,
  promoterApplicationSchema,
  submitPromoterApplication,
  type EstimatedMonthlyReferrals,
  type PromoterPlatform,
  type PromoterType,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const TYPE_LABELS: Record<PromoterType, string> = {
  creator: 'Creator',
  community: 'Community',
  agency: 'Agency',
  consultant: 'Consultant',
  other: 'Something else',
};

const PLATFORM_LABELS: Record<PromoterPlatform, string> = {
  website: 'Website',
  newsletter: 'Newsletter',
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  podcast: 'Podcast',
  in_person: 'In person',
  other: 'Other',
};

const VOLUME_LABELS: Record<EstimatedMonthlyReferrals, string> = {
  under_10: 'Under 10 a month',
  '10_to_50': '10 to 50 a month',
  '50_to_200': '50 to 200 a month',
  over_200: 'Over 200 a month',
};

export default function PromoterApplicationPage() {
  const router = useRouter();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [promoterType, setPromoterType] = useState<PromoterType>('creator');
  const [platforms, setPlatforms] = useState<PromoterPlatform[]>([]);
  const [audience, setAudience] = useState('');
  const [volume, setVolume] = useState<EstimatedMonthlyReferrals>('under_10');
  const [motivation, setMotivation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const parsed = promoterApplicationSchema.safeParse({
      contact_name: contactName,
      contact_email: contactEmail,
      website: website || null,
      motivation,
      promoter_type: promoterType,
      platforms,
      audience_size: audience.trim() === '' ? null : Number(audience),
      estimated_monthly_referrals: volume,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form.');
      setBusy(false);
      return;
    }

    try {
      await submitPromoterApplication(getSupabaseBrowserClient(), parsed.data);
      router.push('/apply');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Apply to promote</h1>
      <p className="mt-1 text-sm text-slate-600">
        A flat fee per referral that converts. Payment is arranged off this platform — we never ask
        for and never store banking details.
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
            You are
            <select
              value={promoterType}
              onChange={(e) => setPromoterType(e.target.value as PromoterType)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            >
              {PROMOTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
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
          <legend className="text-sm font-medium text-slate-700">Where you reach people</legend>
          <div className="flex flex-wrap gap-2">
            {PROMOTER_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  setPlatforms((prev) =>
                    prev.includes(p) ? prev.filter((v) => v !== p) : [...prev, p]
                  )
                }
                aria-pressed={platforms.includes(p)}
                className={`min-h-[40px] rounded-lg border px-3 text-sm ${
                  platforms.includes(p)
                    ? 'border-brand bg-surface font-semibold text-brand-dark'
                    : 'border-slate-300'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Audience size <span className="font-normal text-slate-400">(optional)</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Referrals you expect
            <select
              value={volume}
              onChange={(e) => setVolume(e.target.value as EstimatedMonthlyReferrals)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            >
              {ESTIMATED_MONTHLY_REFERRALS.map((v) => (
                <option key={v} value={v}>
                  {VOLUME_LABELS[v]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Who is your audience, and why would they be here?
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
