'use client';

import Link from 'next/link';
import { membershipFor, type MembershipLike } from '@marketplace/shared';

/**
 * What a member sees where a paid feature would be.
 *
 * Presentation only, and honest about it: everything this hides is also
 * refused by the database (see `enforce_listing_limit`). It is here so the
 * refusal arrives as a sentence rather than as a constraint violation.
 */
export function MembershipGate({
  membership,
  children,
  reason = 'This needs a membership.',
}: {
  membership: MembershipLike | null | undefined;
  children: React.ReactNode;
  reason?: string;
}) {
  if (membershipFor(membership).isMember) return <>{children}</>;

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="font-semibold text-brand-dark">{reason}</p>
      <p className="mt-1 text-sm text-slate-600">
        Browsing, messages and your account are free and always will be.
      </p>
      <Link
        href="/membership"
        className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
      >
        See membership
      </Link>
    </div>
  );
}
