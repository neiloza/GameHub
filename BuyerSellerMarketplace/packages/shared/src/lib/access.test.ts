import { describe, expect, it } from 'vitest';
import {
  ACCESS_RULES,
  canAccessPath,
  homeFor,
  isPreviewableRole,
  navLinksFor,
  requiresAuth,
  ruleFor,
} from './access';
import { ROLES, type Role } from '../constants';

/** Seller tooling no other role may reach. */
const SELLER_ONLY = ['/listings', '/membership', '/refer'];
/** The buyer portal. */
const BUYER_ONLY = ['/buyer', '/buyer/discover', '/buyer/messages'];

describe('ruleFor', () => {
  it('returns null for public paths', () => {
    for (const path of ['/', '/auth/sign-in', '/auth/reset-password', '/privacy', '/terms']) {
      expect(ruleFor(path)).toBeNull();
      expect(requiresAuth(path)).toBe(false);
    }
  });

  it('matches a prefix exactly or as a parent segment, never as a substring', () => {
    expect(ruleFor('/listings')?.prefix).toBe('/listings');
    expect(ruleFor('/listings/abc/edit')?.prefix).toBe('/listings');
    // `/listings-archive` is a different route that happens to share a prefix.
    expect(ruleFor('/listings-archive')).toBeNull();
  });

  it('resolves the longest matching prefix', () => {
    // Both `/buyer` and (were it added) a shorter neighbour could match; the
    // longest wins so a nested portal route never inherits a looser rule.
    expect(ruleFor('/buyer/messages/123')?.prefix).toBe('/buyer');
  });
});

describe('canAccessPath', () => {
  it('keeps every other role out of seller tooling', () => {
    for (const path of SELLER_ONLY) {
      expect(canAccessPath(path, { role: 'seller' })).toBe(true);
      expect(canAccessPath(path, { role: 'both' })).toBe(true);
      expect(canAccessPath(path, { role: 'buyer' })).toBe(false);
      expect(canAccessPath(path, { role: 'advertiser' })).toBe(false);
      expect(canAccessPath(path, { role: 'promoter' })).toBe(false);
    }
  });

  it('keeps every other role out of the buyer portal', () => {
    for (const path of BUYER_ONLY) {
      expect(canAccessPath(path, { role: 'buyer' })).toBe(true);
      expect(canAccessPath(path, { role: 'both' })).toBe(true);
      expect(canAccessPath(path, { role: 'seller' })).toBe(false);
      expect(canAccessPath(path, { role: 'advertiser' })).toBe(false);
      expect(canAccessPath(path, { role: 'promoter' })).toBe(false);
    }
  });

  it('gives the promoter their portal and nothing else', () => {
    expect(canAccessPath('/promoter', { role: 'promoter' })).toBe(true);
    for (const path of [...SELLER_ONLY, ...BUYER_ONLY, '/advertiser', '/admin']) {
      expect(canAccessPath(path, { role: 'promoter' })).toBe(false);
    }
  });

  it('gives the advertiser their portal and nothing else', () => {
    expect(canAccessPath('/advertiser', { role: 'advertiser' })).toBe(true);
    for (const path of [...SELLER_ONLY, ...BUYER_ONLY, '/promoter', '/admin']) {
      expect(canAccessPath(path, { role: 'advertiser' })).toBe(false);
    }
  });

  it('admits no role to /admin without the flag, and every role with it', () => {
    for (const role of ROLES) {
      expect(canAccessPath('/admin', { role })).toBe(false);
      expect(canAccessPath('/admin/users', { role, isAdmin: true })).toBe(true);
    }
  });

  it('lets an administrator reach every role surface, so they can test them', () => {
    for (const path of [...SELLER_ONLY, ...BUYER_ONLY, '/promoter', '/advertiser']) {
      expect(canAccessPath(path, { role: 'seller', isAdmin: true })).toBe(true);
    }
  });

  it('opens shared surfaces to every signed-in member', () => {
    for (const role of ROLES) {
      for (const path of ['/settings', '/notifications', '/apply', '/onboarding', '/directory']) {
        expect(canAccessPath(path, { role })).toBe(true);
      }
    }
  });

  it('offers feedback to the two sides that have a surface to speak from', () => {
    expect(canAccessPath('/feedback', { role: 'seller' })).toBe(true);
    expect(canAccessPath('/feedback', { role: 'buyer' })).toBe(true);
    expect(canAccessPath('/feedback', { role: 'both' })).toBe(true);
    expect(canAccessPath('/feedback', { role: 'advertiser' })).toBe(false);
    expect(canAccessPath('/feedback', { role: 'promoter' })).toBe(false);
  });
});

describe('homeFor', () => {
  it('sends every role somewhere it may actually go', () => {
    for (const role of ROLES) {
      const home = homeFor(role);
      expect(canAccessPath(home, { role })).toBe(true);
    }
  });
});

describe('navLinksFor', () => {
  it('only ever links somewhere the viewer may go', () => {
    for (const role of ROLES) {
      for (const link of navLinksFor({ role })) {
        expect(canAccessPath(link.href, { role })).toBe(true);
      }
    }
  });

  it('does not widen for an administrator — that is what preview is for', () => {
    const asSeller = navLinksFor({ role: 'seller' });
    const asAdmin = navLinksFor({ role: 'seller', isAdmin: true });
    expect(asAdmin).toEqual(asSeller);
  });
});

describe('isPreviewableRole', () => {
  it('accepts the four member roles and refuses `both` and junk', () => {
    expect(isPreviewableRole('seller')).toBe(true);
    expect(isPreviewableRole('buyer')).toBe(true);
    expect(isPreviewableRole('advertiser')).toBe(true);
    expect(isPreviewableRole('promoter')).toBe(true);
    // A combination, not an experience of its own.
    expect(isPreviewableRole('both')).toBe(false);
    expect(isPreviewableRole('admin')).toBe(false);
    expect(isPreviewableRole(null)).toBe(false);
    expect(isPreviewableRole(7)).toBe(false);
  });
});

describe('the rule table itself', () => {
  it('names only roles that exist', () => {
    for (const rule of ACCESS_RULES) {
      for (const role of rule.roles ?? []) {
        expect(ROLES).toContain(role as Role);
      }
    }
  });

  it('has no duplicate prefixes, which would make the longest-match ambiguous', () => {
    const prefixes = ACCESS_RULES.map((r) => r.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
