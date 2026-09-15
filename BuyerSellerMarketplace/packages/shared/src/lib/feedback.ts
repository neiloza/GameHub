import type { Role } from '../constants';

/**
 * Which side of the product a member is speaking from, and whether they get the
 * feedback button at all.
 *
 * Pure and unit-tested rather than inlined in the component, for the reason the
 * rest of `lib/` is: the answer is a rule with three edges (a `both` account, a
 * route that belongs to the other side, a role with no side at all), and a rule
 * with edges belongs somewhere it can be read and tested in one place.
 *
 * The rule is *route first, role second*. An account holding `both` sitting on
 * `/buyer/discover` is talking about the discovery deck, and stamping that
 * suggestion `seller` because their profile lists seller first would file it
 * under the wrong half of the roadmap — which is the one question the `surface`
 * column exists to answer.
 */

export const FEEDBACK_SURFACES = ['seller', 'buyer'] as const;
export type FeedbackSurface = (typeof FEEDBACK_SURFACES)[number];

const SELLER_ROLES: readonly Role[] = ['seller', 'both'];
const BUYER_ROLES: readonly Role[] = ['buyer', 'both'];

/** The buyer portal's own routes. Everything else is seller-side. */
const BUYER_PREFIX = '/buyer';

/**
 * Routes where the button is an interruption rather than an invitation: the
 * public landing page, the auth screens, account setup, the application forms,
 * and the admin area — where an administrator is working on somebody else's
 * record and has their own ways to raise things.
 *
 * `/feedback` is on the list for a different reason: that page already carries
 * the same form, and a floating button that opens a second copy over the top of
 * it is a button that does nothing a reader can make sense of.
 */
const QUIET_PREFIXES = [
  '/auth',
  '/onboarding',
  '/apply',
  '/verify-identity',
  '/admin',
  '/feedback',
];

export function isQuietForFeedback(pathname: string): boolean {
  return pathname === '/' || QUIET_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * The surface a suggestion written at `pathname` by `role` belongs to, or
 * `null` when this member has no side of the product to speak from.
 *
 * Advertisers and promoters get `null`: their portals are a listing and a
 * referral link, and `may_give_feedback_as()` would refuse the insert anyway.
 * Returning null here is what stops us showing a button that fails.
 */
export function feedbackSurfaceFor(
  role: Role | null | undefined,
  pathname: string
): FeedbackSurface | null {
  if (!role) return null;
  const seller = SELLER_ROLES.includes(role);
  const buyer = BUYER_ROLES.includes(role);

  if (pathname === BUYER_PREFIX || pathname.startsWith(BUYER_PREFIX + '/')) {
    return buyer ? 'buyer' : null;
  }
  if (seller) return 'seller';
  if (buyer) return 'buyer';
  return null;
}

/** Should the floating feedback button be on screen at all? */
export function showsFeedbackButton(role: Role | null | undefined, pathname: string): boolean {
  return !isQuietForFeedback(pathname) && feedbackSurfaceFor(role, pathname) !== null;
}
