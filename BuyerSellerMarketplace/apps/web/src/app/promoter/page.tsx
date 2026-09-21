'use client';

import { useEffect, useState } from 'react';
import {
  acceptPromoterAgreement,
  ensureMyReferralCode,
  formatCents,
  getMyPromoterAccount,
  getMyReferrals,
  referralLink,
  summarizeEarnings,
  type PromoterAccount,
  type Referral,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function PromoterPage() {
  const [account, setAccount] = useState<PromoterAccount | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // window is not there during server rendering, and the link is built from
    // wherever the app is actually being served.
    setOrigin(window.location.origin);

    const supabase = getSupabaseBrowserClient();
    Promise.all([
      getMyPromoterAccount(supabase),
      getMyReferrals(supabase),
      ensureMyReferralCode(supabase),
    ])
      .then(([a, r, c]) => {
        setAccount(a);
        setReferrals(r);
        setCode(c);
      })
      .finally(() => setLoading(false));
  }, []);

  async function accept() {
    setBusy(true);
    try {
      setAccount(await acceptPromoterAgreement(getSupabaseBrowserClient()));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(referralLink(origin, code));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  const earnings = summarizeEarnings(referrals);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Your promoter portal</h1>

      {!account?.active && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">Two steps before you start earning</p>
          <ul className="mt-3 grid gap-2 text-sm text-amber-900">
            <li className="flex items-center justify-between gap-3">
              <span>
                {account?.agreement_accepted_at ? '✓ ' : '1. '}
                Accept the promoter agreement
              </span>
              {!account?.agreement_accepted_at && (
                <button
                  type="button"
                  onClick={accept}
                  disabled={busy}
                  className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Accept
                </button>
              )}
            </li>
            <li>
              {account?.payment_confirmed_at ? '✓ ' : '2. '}
              Payment setup confirmed by an administrator
            </li>
          </ul>
          <p className="mt-3 border-t border-amber-200 pt-3 text-xs text-amber-900">
            Payment is arranged off this platform — we never ask for and never store banking
            details. Your link works from today; it starts earning once both steps are done.
          </p>
        </div>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">Your link</h2>
        <p className="mt-1 text-sm text-slate-600">
          The first code on a signup is the one that sticks. Attribution never moves afterwards, and
          a code cannot be applied to your own account.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg bg-surface px-3 py-2 text-sm">
            {code ? referralLink(origin, code) : '…'}
          </code>
          <button
            type="button"
            onClick={copy}
            className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ['Signed up', String(earnings.signedUp)],
          ['Converted', String(earnings.converted)],
          ['Owed', formatCents(earnings.owedCents)],
          ['Paid to date', formatCents(earnings.paidCents)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-brand-dark">{value}</p>
          </div>
        ))}
      </section>

      <p className="mt-4 text-sm text-slate-600">
        A referral qualifies when an invoice is actually paid, so an abandoned checkout earns
        nothing. Your rate is recorded when the referral is created, so a later change never
        reprices what you have already earned.
        {earnings.payoutReady && ' Your balance is above the payout threshold.'}
      </p>
    </div>
  );
}
