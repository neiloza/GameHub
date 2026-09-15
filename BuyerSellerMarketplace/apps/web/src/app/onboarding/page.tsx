'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { completeOnboarding, homeFor, MEMBER_ROLES, ROLE_LABELS } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Account setup: the screen that turns an auth user into a member.
 *
 * The role picked here is a *routing* choice, not a grant. The database forces
 * every new profile to `seller` and refuses any later self-change, so picking
 * "buyer" sends the member to the buyer application rather than making them
 * one. Saying so on the screen is the difference between an application and a
 * form that appears to have failed.
 */
function OnboardingForm() {
  const router = useRouter();
  const search = useSearchParams();
  const initial = search.get('role');

  const [role, setRole] = useState(
    (MEMBER_ROLES as readonly string[]).includes(initial ?? '') ? initial! : 'seller'
  );
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding(getSupabaseBrowserClient(), {
        display_name: displayName,
        location: location || null,
        bio: null,
      });
      // Seller is the only role an account can simply have. Everything else is
      // an application, so send them to write one.
      router.push(role === 'seller' ? homeFor('seller') : `/apply/${role}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-lg sm:mt-12">
      <form onSubmit={submit} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Set up your account</h1>
          <p className="mt-1 text-sm text-slate-500">Two things, then you are in.</p>
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Display name
          <input
            required
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you want to appear to other members"
            className="h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Location <span className="font-normal text-slate-400">(optional)</span>
          <input
            maxLength={120}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Austin, TX"
            className="h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">What brings you here?</legend>
          <div className="grid gap-2">
            {MEMBER_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`rounded-lg border px-4 py-3 text-left ${
                  role === r ? 'border-brand bg-surface' : 'border-slate-300'
                }`}
              >
                <span className="block font-semibold text-brand-dark">{ROLE_LABELS[r]}</span>
                <span className="block text-xs text-slate-600">
                  {r === 'seller'
                    ? 'Start straight away'
                    : 'An administrator reviews this before it goes live'}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
