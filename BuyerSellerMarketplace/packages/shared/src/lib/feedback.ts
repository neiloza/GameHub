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
 * The rule is *route first, role second*. An account holding `both` sitting in
 * the catalogue is talking about shopping, and stamping that suggestion
 * `seller` because they also run a shop would file it under the wrong half of
 * the roadmap — which is the one question the `surface` column exists to
 * answer.
 *
 * Buyer is the fallback rather than a role check, because every signed-in
 * member can buy. Only the seller side needs the role.
 */

export const FEEDBACK_SURFACES = ['seller', 'buyer'] as const;
export type FeedbackSurface = (typeof FEEDBACK_SURFACES)[number];

const SELLER_ROLES: readonly Role[] = ['seller', 'both'];

/** The seller's own routes. Everything else is somebody shopping. */
const SELLER_PREFIXES = ['/listings', '/membership', '/refer'];

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
 * referral link, they cannot buy or sell, and `may_give_feedback_as()` would
 * refuse the insert anyway. Returning null here is what stops us showing a
 * button that fails.
 */
export function feedbackSurfaceFor(
  role: Role | null | undefined,
  pathname: string
): FeedbackSurface | null {
  if (!role) return null;
  if (role === 'advertiser' || role === 'promoter') return null;

  const onSellerRoute = SELLER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (onSellerRoute) return SELLER_ROLES.includes(role) ? 'seller' : null;

  // Everything else is the shop, and everybody can shop.
  return 'buyer';
}

/** Should the floating feedback button be on screen at all? */
export function showsFeedbackButton(role: Role | null | undefined, pathname: string): boolean {
  return !isQuietForFeedback(pathname) && feedbackSurfaceFor(role, pathname) !== null;
}
