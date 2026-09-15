import type { Role } from '../constants';

/**
 * Who may reach what.
 *
 * The permission matrix as data, in one pure module, so "may this role open
 * this page?" has a single answer shared by the navigation, the middleware and
 * any per-page guard — and so it can be unit-tested instead of inferred from
 * conditionals scattered across components.
 *
 * **This is routing and presentation only.** The database is the real boundary:
 * RLS decides which rows come back, `is_approved_buyer()` gates the discovery
 * deck, and `protect_profile_privileged_columns()` decides who may change a
 * role. A member who types a URL this module would hide still gets nothing
 * useful — the point of gating it here is that they get their own home surface
 * instead of an empty shell belonging to somebody else's role.
 */

/** Roles that reach seller tooling. `both` sells and buys. */
const SELLER_ROLES: readonly Role[] = ['seller', 'both'];
const BUYER_ROLES: readonly Role[] = ['buyer', 'both'];

export type AccessRule = {
  /** Route prefix. Matched as the whole path or as `prefix + '/'`. */
  prefix: string;
  /** Roles permitted. Omitted means every signed-in member. */
  roles?: readonly Role[];
  /** Requires `profiles.is_admin`, independently of role. */
  admin?: boolean;
};

/**
 * Longest-prefix-first at lookup time, so `/buyer/messages` resolves against
 * `/buyer` and never against a shorter neighbour.
 */
export const ACCESS_RULES: readonly AccessRule[] = [
  // --- seller tooling ---
  { prefix: '/listings', roles: SELLER_ROLES },
  { prefix: '/membership', roles: SELLER_ROLES },
  { prefix: '/refer', roles: SELLER_ROLES },

  // --- buyer portal (the database also requires an approved application) ---
  { prefix: '/buyer', roles: BUYER_ROLES },

  // --- promoter: their portal and nothing else ---
  { prefix: '/promoter', roles: ['promoter'] },

  // --- advertiser: their listing and campaigns, nothing that reaches a seller ---
  { prefix: '/advertiser', roles: ['advertiser'] },

  // --- admin ---
  { prefix: '/admin', admin: true },

  // --- feedback: matches may_give_feedback_as() in the database ---
  { prefix: '/feedback', roles: [...SELLER_ROLES, 'buyer'] },

  // --- open to every signed-in member ---
  { prefix: '/directory' },
  { prefix: '/apply' },
  { prefix: '/onboarding' },
  { prefix: '/settings' },
  { prefix: '/notifications' },
  { prefix: '/verify-identity' },
];

/** True when `path` is exactly `prefix` or sits underneath it. */
function matches(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/');
}

/**
 * The rule governing `path`, or `null` when the path is public — the landing
 * page, the auth screens, the legal pages and anything else not listed above.
 */
export function ruleFor(path: string): AccessRule | null {
  let best: AccessRule | null = null;
  for (const rule of ACCESS_RULES) {
    if (!matches(path, rule.prefix)) continue;
    if (!best || rule.prefix.length > best.prefix.length) best = rule;
  }
  return best;
}

/** True when `path` requires a signed-in account. */
export function requiresAuth(path: string): boolean {
  return ruleFor(path) !== null;
}

export type Viewer = { role: Role; isAdmin?: boolean };

/**
 * May this viewer open this path?
 *
 * Administrators pass everywhere: an administrator has to be able to enter and
 * test every role, workflow and dashboard without being redirected into the
 * seller experience.
 */
export function canAccessPath(path: string, viewer: Viewer): boolean {
  const rule = ruleFor(path);
  if (!rule) return true;
  if (viewer.isAdmin) return true;
  if (rule.admin) return false;
  if (!rule.roles) return true;
  return rule.roles.includes(viewer.role);
}

/**
 * Where a role lands after sign-in, after account setup, and when it is turned
 * away from a surface it may not reach.
 */
export function homeFor(role: Role): string {
  switch (role) {
    case 'buyer':
      return '/buyer/discover';
    case 'promoter':
      return '/promoter';
    case 'advertiser':
      return '/advertiser';
    case 'seller':
    case 'both':
    default:
      return '/listings';
  }
}

export type NavLink = { href: string; label: string };

type NavEntry = NavLink & { roles?: readonly Role[] };

const NAV: readonly NavEntry[] = [
  { href: '/listings', label: 'My listings', roles: SELLER_ROLES },
  { href: '/buyer/discover', label: 'Discover', roles: BUYER_ROLES },
  { href: '/buyer/messages', label: 'Messages', roles: BUYER_ROLES },
  { href: '/directory', label: 'Directory' },
  { href: '/refer', label: 'Refer', roles: SELLER_ROLES },
  { href: '/membership', label: 'Membership', roles: SELLER_ROLES },
  { href: '/promoter', label: 'Promoter', roles: ['promoter'] },
  { href: '/advertiser', label: 'My listing', roles: ['advertiser'] },
];

/**
 * The navigation for one viewer.
 *
 * Note this does *not* widen for an administrator the way `canAccessPath` does.
 * An admin still sees their own role's navigation plus the Admin link; seeing
 * every role's links at once is what the role preview is for, and it is what
 * makes the bar unreadable for an account holding several roles.
 */
export function navLinksFor(viewer: Viewer): NavLink[] {
  return NAV.filter((l) => {
    if (!l.roles) return true;
    return l.roles.includes(viewer.role);
  }).map(({ href, label }) => ({ href, label }));
}

/**
 * Roles an administrator may preview.
 *
 * Preview is presentation only — it swaps the navigation and the landing
 * surface so an admin can check a role's experience without holding the role.
 * It grants nothing: every read still runs as the administrator, under the
 * administrator's own RLS. `both` is excluded because it is a combination
 * rather than an experience of its own.
 */
export const PREVIEWABLE_ROLES = ['seller', 'buyer', 'advertiser', 'promoter'] as const;
export type PreviewableRole = (typeof PREVIEWABLE_ROLES)[number];

export function isPreviewableRole(value: unknown): value is PreviewableRole {
  return typeof value === 'string' && (PREVIEWABLE_ROLES as readonly string[]).includes(value);
}
