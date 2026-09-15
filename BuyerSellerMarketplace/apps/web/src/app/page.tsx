import Link from 'next/link';
import { MEMBER_ROLES, ROLE_LABELS } from '@marketplace/shared';

const PITCH: Record<(typeof MEMBER_ROLES)[number], string> = {
  seller: 'List what you have. Buyers come to you, and you decide who gets a conversation.',
  buyer: 'Browse listings ranked against what you are actually looking for.',
  advertiser: 'Reach people who are already here to transact.',
  promoter: 'Share a link, earn a fee on every referral that converts.',
};

export default function HomePage() {
  return (
    <div className="py-12 sm:py-20">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          A marketplace where nobody gets messaged uninvited
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Sellers list. Approved buyers browse and express interest. A conversation opens only when
          the seller says yes — which is the whole of the trust model, and it is enforced in the
          database rather than promised in a policy.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/sign-up?role=seller"
            className="inline-flex h-12 items-center rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark"
          >
            List something
          </Link>
          <Link
            href="/auth/sign-up?role=buyer"
            className="inline-flex h-12 items-center rounded-lg border border-slate-300 bg-white px-6 font-semibold text-brand-dark hover:bg-surface"
          >
            Apply as a buyer
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        {MEMBER_ROLES.map((role) => (
          <Link
            key={role}
            href={`/auth/sign-up?role=${role}`}
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-brand"
          >
            <h2 className="font-bold text-brand-dark">{ROLE_LABELS[role]}</h2>
            <p className="mt-1 text-sm text-slate-600">{PITCH[role]}</p>
          </Link>
        ))}
      </section>

      <section className="mt-16 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">What is free, and stays free</h2>
        <p className="mt-2 text-sm text-slate-600">
          Browsing listings, reading and sending messages, receiving notifications, managing your
          account, and applying for any role. A membership raises how many listings a seller can
          hold at once — nothing else, ever. That promise is a unit test rather than a sentence on a
          page: see <code className="text-xs">NEVER_GATED_CAPABILITIES</code>.
        </p>
      </section>
    </div>
  );
}
