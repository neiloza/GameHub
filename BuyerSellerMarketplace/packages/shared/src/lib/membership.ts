/**
 * Membership entitlements.
 *
 * The rule this module exists to enforce: a paid membership buys *tooling*,
 * never access to the other side of the marketplace. Browsing listings, reading
 * messages, receiving notifications, managing an account and applying for a
 * role are free on every plan, and `NEVER_GATED_CAPABILITIES` plus the test
 * beside this file make that a build-time guarantee rather than a policy
 * somebody has to remember.
 *
 * What a membership does buy: listings beyond the free allowance, and whatever
 * self-management tooling you add. The listing cap is the only gate enforced in
 * the database too (`enforce_listing_limit`), because it is the only one where
 * a client-side check could be bypassed by writing straight to the table.
 *
 * This module is the single place that decides what a membership includes. If a
 * free tier is ever wanted, `FREE_LISTINGS` and `FREE_LIMITS` in constants.ts
 * are the whole conversation — nothing else needs to move.
 */

import { FREE_LISTINGS, MEMBER_LISTING_LIMIT, TRIAL_ENABLED } from '../constants';
import type { MembershipState, NeverGatedCapability, Plan } from '../constants';

export type MembershipLike = {
  plan?: string | null;
  state?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
};

export type MembershipEntitlements = Record<NeverGatedCapability, boolean> & {
  plan: Plan;
  state: MembershipState;
  isMember: boolean;
  /** How many listings this account may hold. */
  listings: number;
};

/**
 * `trialing` counts as active only while trials are switched on. Leaving the
 * state in the set unconditionally would make a stray `trialing` row — from a
 * processor test, a restored backup, a webhook replayed out of order — grant
 * access the product does not currently offer.
 */
const activeStates = (): Set<string> =>
  TRIAL_ENABLED ? new Set(['active', 'trialing']) : new Set(['active']);

/**
 * A membership is active while it is paid for — including after cancellation,
 * until the period the member already paid for runs out. `past_due` is not
 * active: the processor is still retrying, and access resumes when a retry
 * succeeds.
 */
export function isMembershipActive(membership: MembershipLike | null | undefined): boolean {
  if (!membership) return false;
  if (!activeStates().has(membership.state ?? '')) return false;
  if (
    membership.current_period_end &&
    new Date(membership.current_period_end).getTime() < Date.now()
  ) {
    return false;
  }
  return true;
}

export function membershipFor(
  membership: MembershipLike | null | undefined
): MembershipEntitlements {
  const isMember = isMembershipActive(membership);
  // No free tier: a lapsed or absent membership is `none`, which is the absence
  // of a plan rather than a tier of one.
  const plan = (isMember ? (membership?.plan ?? 'none') : 'none') as Plan;
  const state = (membership?.state ?? 'none') as MembershipState;

  return {
    plan,
    state,
    isMember,

    // Paid tooling.
    listings: isMember ? MEMBER_LISTING_LIMIT : FREE_LISTINGS,

    // Free on every plan, always. Changing any of these to depend on
    // `isMember` breaks the promise the product is built on — and the test.
    browse_listings: true,
    read_messages: true,
    receive_notifications: true,
    manage_account: true,
    apply_for_a_role: true,
  };
}

/** Can this seller start another listing right now? */
export function canAddListing(
  membership: MembershipLike | null | undefined,
  currentCount: number
): { allowed: boolean; reason?: 'cap_reached' | 'membership_required' } {
  if (currentCount >= MEMBER_LISTING_LIMIT) {
    return { allowed: false, reason: 'cap_reached' };
  }
  if (currentCount >= membershipFor(membership).listings) {
    return { allowed: false, reason: 'membership_required' };
  }
  return { allowed: true };
}

/** True when the member should be told something needs their attention. */
export function needsBillingAttention(membership: MembershipLike | null | undefined): boolean {
  return membership?.state === 'past_due';
}

// --- reconciliation ---------------------------------------------------------

export type ReconcilableMembership = MembershipLike & {
  profile_id: string;
  processor_subscription_id?: string | null;
  crm_synced_at?: string | null;
  crm_sync_error?: string | null;
};

export type ReconciliationIssue = {
  profile_id: string;
  kind: 'payment_failed' | 'never_synced' | 'sync_error' | 'stale_sync' | 'expired_but_active';
  detail: string;
};

/**
 * Rows the admin reconciliation view should flag.
 *
 * The payment processor and this database are two systems that can disagree,
 * and every way they can disagree is a member who is either being charged for
 * nothing or getting something for nothing. This lists the disagreements; a
 * person decides what to do about each.
 */
export function reconcileMemberships(
  rows: ReconcilableMembership[],
  now: Date = new Date(),
  staleAfterHours = 48
): ReconciliationIssue[] {
  const issues: ReconciliationIssue[] = [];
  const staleBefore = now.getTime() - staleAfterHours * 3600_000;
  const active = activeStates();

  for (const row of rows) {
    if (row.state === 'past_due') {
      issues.push({
        profile_id: row.profile_id,
        kind: 'payment_failed',
        detail: 'The payment processor reports past_due',
      });
    }

    // The processor says active but the period we recorded has already run out
    // — the two systems disagree and a human should look.
    if (
      active.has(row.state ?? '') &&
      row.current_period_end &&
      new Date(row.current_period_end).getTime() < now.getTime()
    ) {
      issues.push({
        profile_id: row.profile_id,
        kind: 'expired_but_active',
        detail: `Active, but the period ended ${row.current_period_end.slice(0, 10)}`,
      });
    }

    // CRM sync only matters for accounts that actually have a subscription.
    if (!row.processor_subscription_id) continue;

    if (row.crm_sync_error) {
      issues.push({ profile_id: row.profile_id, kind: 'sync_error', detail: row.crm_sync_error });
    } else if (!row.crm_synced_at) {
      issues.push({
        profile_id: row.profile_id,
        kind: 'never_synced',
        detail: 'Never synced to the CRM',
      });
    } else if (new Date(row.crm_synced_at).getTime() < staleBefore) {
      issues.push({
        profile_id: row.profile_id,
        kind: 'stale_sync',
        detail: `Last synced ${row.crm_synced_at.slice(0, 10)}`,
      });
    }
  }

  return issues;
}
