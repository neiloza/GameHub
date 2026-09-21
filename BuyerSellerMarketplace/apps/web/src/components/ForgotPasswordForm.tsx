'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Step one of password recovery: ask for the link.
 *
 * The confirmation below is deliberately the same whether or not an account
 * exists for that address. Supabase's `resetPasswordForEmail` does not report
 * the difference either, and that is the right behaviour: a form that says "no
 * account with that email" is an account-enumeration oracle, and on a platform
 * where the member list includes buyers and sellers, confirming who
 * holds an account is itself a disclosure.
 *
 * An error that does come back is therefore never about the address — it is
 * about us (rate limiting, network, SMTP not configured), so it is worth
 * showing rather than swallowing.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    // The link lands on /auth/callback, which exchanges the code for a session
    // and then forwards to the page that actually sets the new password. Going
    // straight to /auth/reset-password would arrive with no session.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        '/auth/reset-password'
      )}`,
    });

    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }


  if (sent) {
    return (
      <div className="mx-auto mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center sm:mt-12">
        <div className="text-4xl">📬</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-slate-600">
          If <span className="font-medium">{email}</span> has an account, a link to choose a new
          password is on its way. It expires in an hour, and using it signs you in.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Nothing arriving? Check spam, and confirm you typed the address you signed up with.
        </p>
        <a
          href="/auth/sign-in"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:mt-12">
      <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
      <p className="mt-2 text-sm text-slate-500">
        Enter the email you signed up with and we will send you a link to choose a new password.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-3">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Send the link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Remembered it?{' '}
        <a className="font-medium text-brand" href="/auth/sign-in">
          Sign in
        </a>
      </p>

      <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Signed up with Google or Apple? You have no password here — go back and use that button
        instead.
      </p>
    </div>
  );
}
