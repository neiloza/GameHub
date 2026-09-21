'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/** Matches the minimum enforced on sign-up, so recovery cannot weaken an account. */
const MIN_LENGTH = 8;

/**
 * Step two of password recovery: choose the new password.
 *
 * Arriving here means `/auth/callback` already exchanged the emailed code for a
 * session, so this page is *authenticated* — `updateUser` is what actually
 * changes the password, and it works because of that session rather than
 * because of anything carried in the URL.
 *
 * Which is also why the no-session case has to be handled explicitly and
 * kindly: opening `/auth/reset-password` directly, or clicking a link that has
 * expired or already been used, lands here with nothing, and "nothing happens
 * when I press the button" is the worst possible outcome for somebody already
 * locked out.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState<'checking' | 'ok' | 'no-session'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) setReady(session ? 'ok' : 'no-session');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Checked here rather than left to the browser: the two fields exist
    // precisely because the member cannot see what they typed, so the mismatch
    // needs naming rather than a generic form rejection.
    if (password !== confirm) {
      setError('Those two passwords do not match.');
      return;
    }
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }

    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }

    // The recovery session is a full session, so there is nothing further to
    // sign into — send them into the app and let it route by role.
    router.push('/');
    router.refresh();
  }

  if (ready === 'checking') {
    return (
      <div className="mx-auto mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 sm:mt-12">
        Checking your link…
      </div>
    );
  }

  if (ready === 'no-session') {
    return (
      <div className="mx-auto mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:mt-12">
        <h1 className="text-2xl font-bold text-slate-900">That link has expired</h1>
        <p className="mt-2 text-slate-600">
          Password links last an hour and can only be used once. Ask for a new one and it will work
          straight away.
        </p>
        <a
          href="/auth/forgot-password"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
        >
          Send a new link
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:mt-12">
      <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
      <p className="mt-2 text-sm text-slate-500">
        You are signed in from the link in your email. Pick a new password and you are done.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          New password
          <input
            type="password"
            required
            minLength={MIN_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${MIN_LENGTH} characters`}
            className="h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Confirm new password
          <input
            type="password"
            required
            minLength={MIN_LENGTH}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save the new password'}
        </button>
      </form>
    </div>
  );
}
