import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms' };

/** A starting point, not terms of service. See the note at the top. */
export default function TermsPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Terms</h1>

      <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Template.</strong> This sketches the rules the software actually enforces. It is not
        legal advice and it is not a finished agreement — have it reviewed before you rely on it.
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">What this platform is</h2>
      <p className="mt-2 text-sm text-slate-700">
        An introduction service. We connect sellers and buyers; we are not party to whatever the two
        of you agree, we do not hold funds, and we do not guarantee that any listing is what it says
        it is.
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">Accounts and roles</h2>
      <p className="mt-2 text-sm text-slate-700">
        Seller is the only self-serve role. Buyer, advertiser and promoter are granted by us after a
        review, and we may decline or withdraw one at any time. You may not hold more than one
        account, and you may not act for somebody else without telling us.
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">Contact</h2>
      <p className="mt-2 text-sm text-slate-700">
        A conversation only opens when a seller accepts a buyer&apos;s interest. Attempting to reach
        members outside that — including by using this platform to collect contact details for use
        elsewhere — is grounds for removal.
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">Membership</h2>
      <p className="mt-2 text-sm text-slate-700">
        Memberships renew until cancelled. Cancelling stops the next renewal and leaves your access
        in place until the period you have already paid for runs out. [Refund policy.]
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">Promoter fees</h2>
      <p className="mt-2 text-sm text-slate-700">
        A referral earns a fee when the referred member&apos;s invoice is actually paid. Self-referrals
        earn nothing. We may disqualify a referral we believe was obtained by misrepresenting this
        platform. [Payout terms and timing.]
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">Ending it</h2>
      <p className="mt-2 text-sm text-slate-700">
        You can close your account whenever you like. We can suspend or close one that breaks these
        terms, and we will tell you why.
      </p>

      <p className="mt-8 text-xs text-slate-500">
        Governed by the laws of [jurisdiction]. Last updated [date].
      </p>
    </article>
  );
}
