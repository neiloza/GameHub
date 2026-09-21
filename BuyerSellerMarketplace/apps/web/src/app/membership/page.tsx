'use client';

import { useEffect, useState } from 'react';
import {
  INTRO_SEATS,
  PLAN_LABELS,
  PLAN_PRICES_CENTS,
  PURCHASABLE_PLANS,
  formatCents,
  getMyMembership,
  introSeatsRemaining,
  membershipFor,
  needsBillingAttention,
  openBillingPortal,
  startMembershipCheckout,
  type Membership,
  type PurchasablePlan,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function MembershipPage() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [seats, setSeats] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getMyMembership(supabase), introSeatsRemaining(supabase)])
      .then(([m, s]) => {
        setMembership(m);
        setSeats(s);
      })
      .catch(() => setSeats(0))
      .finally(() => setLoading(false));
  }, []);

  async function checkout(plan: PurchasablePlan) {
    setBusy(true);
    setError(null);
    try {
      window.location.href = await startMembershipCheckout(
        getSupabaseBrowserClient(),
        '/membership',
        plan
      );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function portal() {
    setBusy(true);
    setError(null);
    try {
      window.location.href = await openBillingPortal(getSupabaseBrowserClient(), '/membership');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  const entitlements = membershipFor(membership);
  const introOpen = (seats ?? 0) > 0;
  // The intro plans are hidden once the cohort is full. The checkout function
  // checks this against the database too, because this page is a suggestion and
  // that endpoint is reachable directly.
  const offered = PURCHASABLE_PLANS.filter((p) => introOpen || !p.startsWith('intro_'));

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Membership</h1>

      {needsBillingAttention(membership) && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">We could not take your last payment</p>
          <p className="mt-1 text-sm text-amber-900">
            Update your card and your membership carries on from where it was.
          </p>
          <button
            type="button"
            onClick={portal}
            disabled={busy}
            className="mt-3 h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Update payment details
          </button>
        </div>
      )}

      {entitlements.isMember ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="font-semibold text-brand-dark">
            You are a member{membership?.plan !== 'none' ? ` on ${membership?.plan}` : ''}.
          </p>
          {membership?.current_period_end && (
            <p className="mt-1 text-sm text-slate-600">
              {membership.cancel_at_period_end ? 'Ends' : 'Renews'} on{' '}
              {new Date(membership.current_period_end).toLocaleDateString()}.
            </p>
          )}
          <p className="mt-2 text-sm text-slate-600">
            You can hold up to {entitlements.listings} listings.
          </p>
          <button
            type="button"
            onClick={portal}
            disabled={busy}
            className="mt-4 h-11 rounded-lg border border-slate-300 px-5 text-sm font-medium hover:bg-surface disabled:opacity-50"
          >
            Manage billing
          </button>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">
            One product, billed monthly or annually.
            {introOpen && ` The founding rate is open while ${seats} of ${INTRO_SEATS} places remain.`}
          </p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {offered.map((plan) => (
              <li key={plan} className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="font-bold text-brand-dark">{PLAN_LABELS[plan]}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {formatCents(PLAN_PRICES_CENTS[plan])}
                </p>
                <button
                  type="button"
                  onClick={() => checkout(plan)}
                  disabled={busy}
                  className="mt-4 h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  Choose this
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">What a membership does not buy</h2>
        <p className="mt-2 text-sm text-slate-600">
          Browsing, reading and sending messages, notifications, managing your account and applying
          for a role are free on every plan and always will be. That is a unit test rather than a
          promise — see <code className="text-xs">NEVER_GATED_CAPABILITIES</code>.
        </p>
      </section>
    </div>
  );
}
