import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_ROLES,
  ONBOARDING_TOURS,
  onboardingRolesFor,
  pendingTour,
  resolveStepHref,
  resumeStepIndex,
  type OnboardingProgress,
} from './onboarding';
import { canAccessPath } from './access';

describe('the tours themselves', () => {
  it('has one tour per onboarding role, keyed to itself', () => {
    for (const role of ONBOARDING_ROLES) {
      expect(ONBOARDING_TOURS[role].role).toBe(role);
      expect(ONBOARDING_TOURS[role].steps.length).toBeGreaterThan(0);
    }
  });

  it('gives every step a unique id, so progress cannot be ambiguous', () => {
    for (const role of ONBOARDING_ROLES) {
      const ids = ONBOARDING_TOURS[role].steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('only ever links a role somewhere that role may actually go', () => {
    for (const role of ONBOARDING_ROLES) {
      for (const step of ONBOARDING_TOURS[role].steps) {
        if (!step.href) continue;
        const href = step.href.replace(':listingId', 'l1');
        expect(canAccessPath(href, { role })).toBe(true);
      }
    }
  });

  it('pairs every linked step with a label for the link', () => {
    for (const role of ONBOARDING_ROLES) {
      for (const step of ONBOARDING_TOURS[role].steps) {
        if (step.href) expect(step.cta).toBeTruthy();
      }
    }
  });
});

describe('onboardingRolesFor', () => {
  it('gives a single-role account its own tour', () => {
    expect(onboardingRolesFor({ role: 'seller' })).toEqual(['seller']);
    expect(onboardingRolesFor({ role: 'promoter' })).toEqual(['promoter']);
  });

  it('gives a `both` account two tours, tracked separately', () => {
    expect(onboardingRolesFor({ role: 'both' })).toEqual(['seller', 'buyer']);
  });

  it('gives an administrator none — the console is not a first run', () => {
    expect(onboardingRolesFor({ role: 'seller', isAdmin: true })).toEqual([]);
  });
});

describe('pendingTour', () => {
  const done = (role: OnboardingProgress['role']): OnboardingProgress => ({
    role,
    last_step: 3,
    dismissed: false,
    completed_at: '2026-06-01T00:00:00Z',
  });

  it('opens the first tour an account has not settled', () => {
    expect(pendingTour({ role: 'seller' }, [])?.role).toBe('seller');
    expect(pendingTour({ role: 'seller' }, [done('seller')])).toBeNull();
  });

  it('treats an explicit skip as settled', () => {
    const skipped: OnboardingProgress = {
      role: 'seller',
      last_step: 1,
      dismissed: true,
      completed_at: null,
    };
    expect(pendingTour({ role: 'seller' }, [skipped])).toBeNull();
  });

  it('still owes the second tour to a `both` account that finished the first', () => {
    expect(pendingTour({ role: 'both' }, [done('seller')])?.role).toBe('buyer');
  });

  it('resumes rather than restarts a half-finished tour', () => {
    const halfway: OnboardingProgress = {
      role: 'seller',
      last_step: 2,
      dismissed: false,
      completed_at: null,
    };
    const tour = pendingTour({ role: 'seller' }, [halfway]);
    expect(tour?.role).toBe('seller');
    expect(resumeStepIndex(tour!, halfway)).toBe(2);
  });
});

describe('resumeStepIndex', () => {
  const tour = ONBOARDING_TOURS.seller;

  it('starts at the top with no saved progress', () => {
    expect(resumeStepIndex(tour)).toBe(0);
  });

  it('clamps a saved step that no longer exists after the tour was shortened', () => {
    expect(
      resumeStepIndex(tour, { role: 'seller', last_step: 999, dismissed: false, completed_at: null })
    ).toBe(tour.steps.length - 1);
  });

  it('refuses junk rather than indexing off the end', () => {
    expect(
      resumeStepIndex(tour, { role: 'seller', last_step: -4, dismissed: false, completed_at: null })
    ).toBe(0);
    expect(
      resumeStepIndex(tour, {
        role: 'seller',
        last_step: Number.NaN,
        dismissed: false,
        completed_at: null,
      })
    ).toBe(0);
  });
});

describe('resolveStepHref', () => {
  const plain = { id: 's', title: '', body: '', href: '/membership' };
  const scoped = { id: 's', title: '', body: '', href: '/listings/:listingId/buyers' };

  it('passes an unscoped route through', () => {
    expect(resolveStepHref(plain)).toBe('/membership');
  });

  it('fills in a listing when there is one', () => {
    expect(resolveStepHref(scoped, { listingId: 'l1' })).toBe('/listings/l1/buyers');
  });

  it('drops the link rather than building a broken URL for a seller with no listing', () => {
    expect(resolveStepHref(scoped)).toBeNull();
    expect(resolveStepHref(scoped, { listingId: null })).toBeNull();
  });

  it('has no link for a purely explanatory step', () => {
    expect(resolveStepHref({ id: 's', title: '', body: '' })).toBeNull();
  });
});
