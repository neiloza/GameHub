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
/** Open to anybody signed in, because anybody can buy. */
const EVERY_MEMBER = ['/messages', '/feedback', '/settings', '/notifications', '/directory'];

describe('ruleFor', () => {
  it('returns null for public paths', () => {
    for (const path of ['/', '/auth/sign-in', '/auth/reset-password', '/privacy', '/terms']) {
      expect(ruleFor(path)).toBeNull();
      expect(requiresAuth(path)).toBe(false);
    }
  });

  it('leaves the catalogue public — a shop you must sign in to see is not a shop', () => {
    expect(ruleFor('/shop')).toBeNull();
    expect(ruleFor('/shop/some-listing-id')).toBeNull();
    expect(requiresAuth('/shop')).toBe(false);
  });

  it('matches a prefix exactly or as a parent segment, never as a substring', () => {
    expect(ruleFor('/listings')?.prefix).toBe('/listings');
    expect(ruleFor('/listings/abc/edit')?.prefix).toBe('/listings');
    // `/listings-archive` is a different route that happens to share a prefix.
    expect(ruleFor('/listings-archive')).toBeNull();
  });

  it('resolves the longest matching prefix', () => {
    // A nested seller route must never inherit a looser rule from a shorter
    // neighbour.
    expect(ruleFor('/listings/abc/enquiries/def')?.prefix).toBe('/listings');
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

  it('lets every signed-in role reach the surfaces buying needs', () => {
    // Anybody can buy, so nothing here is role-gated — including the advertiser
    // and promoter, who have an inbox like everybody else.
    for (const path of EVERY_MEMBER) {
      for (const role of ROLES) {
        expect(canAccessPath(path, { role })).toBe(true);
      }
    }
  });

  it("keeps the promoter out of every other role's tooling", () => {
    expect(canAccessPath('/promoter', { role: 'promoter' })).toBe(true);
    for (const path of [...SELLER_ONLY, '/advertiser', '/admin']) {
      expect(canAccessPath(path, { role: 'promoter' })).toBe(false);
    }
  });

  it("keeps the advertiser out of every other role's tooling", () => {
    expect(canAccessPath('/advertiser', { role: 'advertiser' })).toBe(true);
    for (const path of [...SELLER_ONLY, '/promoter', '/admin']) {
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
    for (const path of [...SELLER_ONLY, '/promoter', '/advertiser']) {
      expect(canAccessPath(path, { role: 'buyer', isAdmin: true })).toBe(true);
    }
  });

  it('opens the application forms to everybody, since selling is applied for', () => {
    for (const role of ROLES) {
      expect(canAccessPath('/apply', { role })).toBe(true);
      expect(canAccessPath('/apply/seller', { role })).toBe(true);
      expect(canAccessPath('/onboarding', { role })).toBe(true);
    }
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
