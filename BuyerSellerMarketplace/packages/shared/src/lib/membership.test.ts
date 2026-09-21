import { describe, expect, it } from 'vitest';
import {
  canAddListing,
  isMembershipActive,
  membershipFor,
  needsBillingAttention,
  reconcileMemberships,
} from './membership';
import {
  FREE_LISTINGS,
  MEMBER_LISTING_LIMIT,
  NEVER_GATED_CAPABILITIES,
  TRIAL_ENABLED,
} from '../constants';

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

describe('the promise', () => {
  /**
   * This is the test the product is built on. If it ever fails, somebody has
   * put a capability the platform promises is free behind the paywall — fix the
   * entitlement, do not edit this test.
   */
  it('never gates a capability listed as never-gated, member or not', () => {
    const member = membershipFor({ plan: 'standard_monthly', state: 'active' });
    const stranger = membershipFor(null);
    for (const capability of NEVER_GATED_CAPABILITIES) {
      expect(member[capability]).toBe(true);
      expect(stranger[capability]).toBe(true);
    }
  });
});

describe('isMembershipActive', () => {
  it('is false with no membership at all', () => {
    expect(isMembershipActive(null)).toBe(false);
    expect(isMembershipActive(undefined)).toBe(false);
  });

  it('is true while active and inside the paid period', () => {
    expect(isMembershipActive({ state: 'active', current_period_end: future })).toBe(true);
  });

  it('stays active after cancellation until the paid period runs out', () => {
    expect(
      isMembershipActive({ state: 'active', current_period_end: future, cancel_at_period_end: true })
    ).toBe(true);
  });

  it('is false once the recorded period has passed, whatever the state says', () => {
    expect(isMembershipActive({ state: 'active', current_period_end: past })).toBe(false);
  });

  it('treats past_due as inactive — the processor is still retrying', () => {
    expect(isMembershipActive({ state: 'past_due', current_period_end: future })).toBe(false);
  });

  it('honours the trial switch rather than a stray trialing row', () => {
    expect(isMembershipActive({ state: 'trialing', current_period_end: future })).toBe(
      TRIAL_ENABLED
    );
  });
});

describe('canAddListing', () => {
  it('refuses a non-member their first listing while there is no free tier', () => {
    const result = canAddListing(null, 0);
    expect(result.allowed).toBe(FREE_LISTINGS > 0);
    if (!result.allowed) expect(result.reason).toBe('membership_required');
  });

  it('lets a member add up to the cap', () => {
    const member = { plan: 'standard_monthly', state: 'active', current_period_end: future };
    expect(canAddListing(member, 0).allowed).toBe(true);
    expect(canAddListing(member, MEMBER_LISTING_LIMIT - 1).allowed).toBe(true);
  });

  it('reports the cap and the paywall as different reasons', () => {
    const member = { plan: 'standard_monthly', state: 'active', current_period_end: future };
    expect(canAddListing(member, MEMBER_LISTING_LIMIT)).toEqual({
      allowed: false,
      reason: 'cap_reached',
    });
  });
});

describe('needsBillingAttention', () => {
  it('flags only the states a member can do something about', () => {
    expect(needsBillingAttention({ state: 'past_due' })).toBe(true);
    expect(needsBillingAttention({ state: 'active' })).toBe(false);
    expect(needsBillingAttention({ state: 'canceled' })).toBe(false);
    expect(needsBillingAttention(null)).toBe(false);
  });
});

describe('reconcileMemberships', () => {
  const now = new Date('2026-06-01T00:00:00Z');

  it('finds nothing wrong with a healthy, freshly synced row', () => {
    expect(
      reconcileMemberships(
        [
          {
            profile_id: 'p1',
            state: 'active',
            current_period_end: '2026-07-01T00:00:00Z',
            processor_subscription_id: 'sub_1',
            crm_synced_at: '2026-05-31T12:00:00Z',
          },
        ],
        now
      )
    ).toEqual([]);
  });

  it('flags a failed payment', () => {
    const issues = reconcileMemberships([{ profile_id: 'p1', state: 'past_due' }], now);
    expect(issues.map((i) => i.kind)).toContain('payment_failed');
  });

  it('flags the two systems disagreeing about the period', () => {
    const issues = reconcileMemberships(
      [{ profile_id: 'p1', state: 'active', current_period_end: '2026-05-01T00:00:00Z' }],
      now
    );
    expect(issues.map((i) => i.kind)).toContain('expired_but_active');
  });

  it('only chases CRM sync for rows that have a subscription', () => {
    const noSub = reconcileMemberships([{ profile_id: 'p1', state: 'active' }], now);
    expect(noSub).toEqual([]);

    const withSub = reconcileMemberships(
      [{ profile_id: 'p1', state: 'active', processor_subscription_id: 'sub_1' }],
      now
    );
    expect(withSub.map((i) => i.kind)).toEqual(['never_synced']);
  });

  it('prefers a real sync error over calling the row stale', () => {
    const issues = reconcileMemberships(
      [
        {
          profile_id: 'p1',
          state: 'active',
          processor_subscription_id: 'sub_1',
          crm_synced_at: '2026-01-01T00:00:00Z',
          crm_sync_error: 'CRM rejected the contact',
        },
      ],
      now
    );
    expect(issues.map((i) => i.kind)).toEqual(['sync_error']);
  });

  it('flags a sync that has gone quiet for longer than the window', () => {
    const issues = reconcileMemberships(
      [
        {
          profile_id: 'p1',
          state: 'active',
          processor_subscription_id: 'sub_1',
          crm_synced_at: '2026-05-25T00:00:00Z',
        },
      ],
      now,
      48
    );
    expect(issues.map((i) => i.kind)).toEqual(['stale_sync']);
  });
});
