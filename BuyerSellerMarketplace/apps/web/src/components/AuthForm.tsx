'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MEMBER_ROLES, ROLE_LABELS, attributeSignup, type MemberRole } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Social sign-in stays hidden until the providers are actually configured.
 *
 * Enabling a button whose provider is switched off in the Supabase dashboard
 * produces an error page rather than a sign-in, and the member has no way to
 * tell that from a broken account. One environment variable, set only once the
 * dashboard is set up, keeps the two in step.
 */
const SOCIAL_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SOCIAL_AUTH === 'true';

const CALLBACK_ERRORS: Record<string, string> = {
  recovery_link_invalid:
    'That password link has expired or was already used. Ask for a new one below.',
  auth_link_invalid: 'That sign-in link did not work. Try again, or use your email and password.',
};

const JOIN_BLURB: Record<MemberRole, string> = {
  seller: 'List what you have and answer buyers who reach out',
  buyer: 'Apply, then browse listings and message sellers who accept',
  advertiser: 'Apply to advertise to our members',
  promoter: 'Apply for a referral link and per-referral earnings',
};

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  // `/auth/callback` redirects here when it cannot exchange a code — almost
  // always an expired or already-used link. Without this the member is bounced
  // back to a blank form with no idea why.
  const linkError = CALLBACK_ERRORS[search.get('error') ?? ''] ?? null;

  // Carry the role choice from the landing page through sign-up into account
  // setup, so the two portal buttons actually pre-select something.
  const role = search.get('role');
  // A promoter's referral code, if they arrived through one. Attached to the
  // account after sign-up succeeds — see below.
  const referral = search.get('ref');

  const onboardingNext = role ? `/onboarding?role=${encodeURIComponent(role)}` : '/onboarding';
  const next = search.get('next') ?? (mode === 'sign-up' ? onboardingNext : '/');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();

    if (mode === 'sign-up') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      // With email confirmation on, sign-up returns no session — the member has
      // to click the link in their inbox before anything else can happen.
      if (!data.session) {
        setConfirmSent(true);
        return;
      }
      await claimReferral();
      router.push(next);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  /**
   * Attach the referral code, if there was one.
   *
   * Deliberately best-effort and never surfaced: attribution is the promoter's
   * business, not the new member's, and "your referral code could not be
   * applied" is a confusing thing to read on the first screen of an account you
   * just made. The database refuses a second code and a self-referral anyway.
   */
  async function claimReferral() {
    if (!referral) return;
    try {
      await attributeSignup(getSupabaseBrowserClient(), referral);
    } catch {
      // Nothing the member can do about it.
    }
  }

  async function oauth(provider: 'google' | 'apple') {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Everything comes back through /auth/callback, which exchanges the
        // code for a session and then forwards. `next` is narrowed there.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
  }

  if (confirmSent) {
    return (
      <div className="mx-auto mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center sm:mt-12">
        <div className="text-4xl">📬</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-slate-600">
          We sent a confirmation link to <span className="font-medium">{email}</span>. Click it to
          finish creating your account, then come back and sign in.
        </p>
        <a
          href="/auth/sign-in"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md sm:mt-12">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === 'sign-up' ? 'Create your account' : 'Welcome back'}
        </h1>

        {linkError && (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {linkError}
          </p>
        )}

        {SOCIAL_ENABLED && (
          <>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => oauth('google')}
                className="h-11 rounded-lg border border-slate-300 font-medium hover:bg-slate-50"
              >
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => oauth('apple')}
                className="h-11 rounded-lg border border-slate-300 font-medium hover:bg-slate-50"
              >
                Continue with Apple
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              or with email
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={submit} className={`grid gap-3 ${SOCIAL_ENABLED ? '' : 'mt-6'}`}>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? 'One moment…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {mode === 'sign-in' && (
          <p className="mt-3 text-center text-sm">
            <a className="font-medium text-brand" href="/auth/forgot-password">
              Forgot your password?
            </a>
          </p>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === 'sign-up' ? (
            <>
              Already have an account?{' '}
              <a className="font-medium text-brand" href="/auth/sign-in">
                Sign in
              </a>
            </>
          ) : (
            <>
              New here?{' '}
              <a className="font-medium text-brand" href="/auth/sign-up">
                Create an account
              </a>
            </>
          )}
        </p>
      </div>

      {mode === 'sign-up' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-brand-dark">What are you joining as?</p>
          <div className="mt-3 grid gap-2">
            {MEMBER_ROLES.map((r) => (
              <a
                key={r}
                href={`/auth/sign-up?role=${r}${referral ? `&ref=${encodeURIComponent(referral)}` : ''}`}
                className={`grid gap-0.5 rounded-lg border px-4 py-3 hover:border-brand hover:bg-surface ${
                  role === r ? 'border-brand bg-surface' : 'border-slate-200'
                }`}
              >
                <span className="font-semibold text-brand-dark">{ROLE_LABELS[r]}</span>
                <span className="text-xs text-slate-600">{JOIN_BLURB[r]}</span>
              </a>
            ))}
          </div>
          <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
            Everything except seller is reviewed by a person before it goes live. Administrators are
            granted the role rather than applying for it, so there is no sign-up for one.
          </p>
        </div>
      )}
    </div>
  );
}
