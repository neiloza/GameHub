'use client';

import { useEffect, useState } from 'react';
import {
  confirmPromoterPayment,
  formatCents,
  listPromoterAccounts,
  markReferralsPaid,
  type PromoterAccount,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminPromotersPage() {
  const [rows, setRows] = useState<PromoterAccount[]>([]);
  const [paidIds, setPaidIds] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPromoterAccounts(getSupabaseBrowserClient())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  async function confirm(account: PromoterAccount) {
    setError(null);
    try {
      const updated = await confirmPromoterPayment(
        getSupabaseBrowserClient(),
        account.profile_id
      );
      setRows((prev) => prev.map((a) => (a.profile_id === updated.profile_id ? updated : a)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function settle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const ids = paidIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const count = await markReferralsPaid(getSupabaseBrowserClient(), ids);
      setResult(`${count} referral${count === 1 ? '' : 's'} marked paid.`);
      setPaidIds('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">One moment…</p>;

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="grid gap-3">
        {rows.map((a) => (
          <li
            key={a.profile_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="font-semibold text-brand-dark">{a.profile_id}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Agreement {a.agreement_accepted_at ? '✓' : '✗'} · Payment setup{' '}
                {a.payment_confirmed_at ? '✓' : '✗'}
              </p>
            </div>
            {!a.payment_confirmed_at && (
              <button
                type="button"
                onClick={() => void confirm(a)}
                className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
              >
                Confirm payment setup
              </button>
            )}
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">Settle a payout run</h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste the referral ids you have actually sent money for. Only qualified rows move, so
          running the same list twice pays once — and the count returned is what to reconcile
          against your bank.
        </p>
        <form onSubmit={settle} className="mt-4 grid gap-3">
          <label className="sr-only" htmlFor="ids">
            Referral ids
          </label>
          <textarea
            id="ids"
            rows={3}
            value={paidIds}
            onChange={(e) => setPaidIds(e.target.value)}
            placeholder="One id per line, or comma separated"
            className="rounded-lg border border-slate-300 p-3 font-mono text-xs"
          />
          <button
            type="submit"
            className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white"
          >
            Mark paid
          </button>
        </form>
        {result && <p className="mt-3 text-sm text-accent">{result}</p>}
        <p className="mt-3 text-xs text-slate-500">
          The minimum payout threshold is {formatCents(5000)}. Nothing here moves money — it records
          that money moved.
        </p>
      </section>
    </>
  );
}
