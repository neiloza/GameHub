import { describe, expect, it } from 'vitest';
import {
  formatCents,
  normalizeReferralCode,
  referralLink,
  summarizeEarnings,
  type ReferralLike,
} from './referrals';
import { MIN_PAYOUT_CENTS, REFERRAL_FEE_CENTS } from '../constants';

const rows: ReferralLike[] = [
  { status: 'pending', fee_cents: 2500 },
  { status: 'pending', fee_cents: 2500 },
  { status: 'qualified', fee_cents: 2500 },
  { status: 'qualified', fee_cents: 3000 }, // an older, higher rate
  { status: 'paid', fee_cents: 2500 },
  { status: 'disqualified', fee_cents: 2500 },
];

describe('summarizeEarnings', () => {
  it('counts a conversion once, whether or not it has been paid yet', () => {
    const s = summarizeEarnings(rows);
    expect(s.signedUp).toBe(6);
    expect(s.converted).toBe(3);
    expect(s.paid).toBe(1);
    expect(s.disqualified).toBe(1);
  });

  it('keeps pending money out of what is owed', () => {
    const s = summarizeEarnings(rows);
    // Two pending rows are worth 5000, but nothing is owed on them and they may
    // never become owed.
    expect(s.pendingCents).toBe(5000);
    expect(s.owedCents).toBe(5500);
    expect(s.paidCents).toBe(2500);
    expect(s.lifetimeCents).toBe(8000);
  });

  it('uses the fee recorded on the row, not the current rate', () => {
    // A rate change must never reprice a referral that already qualified.
    const s = summarizeEarnings([{ status: 'qualified', fee_cents: 9999 }]);
    expect(s.owedCents).toBe(9999);
    expect(s.owedCents).not.toBe(REFERRAL_FEE_CENTS);
  });

  it('is empty rather than broken with no referrals at all', () => {
    const s = summarizeEarnings([]);
    expect(s).toMatchObject({ signedUp: 0, owedCents: 0, lifetimeCents: 0, payoutReady: false });
  });

  it('marks a balance payout-ready only at the threshold', () => {
    const under = summarizeEarnings([{ status: 'qualified', fee_cents: MIN_PAYOUT_CENTS - 1 }]);
    const at = summarizeEarnings([{ status: 'qualified', fee_cents: MIN_PAYOUT_CENTS }]);
    expect(under.payoutReady).toBe(false);
    expect(at.payoutReady).toBe(true);
  });

  it('does not count disqualified money anywhere', () => {
    const s = summarizeEarnings([{ status: 'disqualified', fee_cents: 100_000 }]);
    expect(s.owedCents).toBe(0);
    expect(s.paidCents).toBe(0);
    expect(s.lifetimeCents).toBe(0);
  });
});

describe('normalizeReferralCode', () => {
  it('matches what the database does before comparing', () => {
    expect(normalizeReferralCode('  abc123 ')).toBe('ABC123');
    expect(normalizeReferralCode('ABC123')).toBe('ABC123');
  });
});

describe('referralLink', () => {
  it('builds one link shape regardless of how the base URL is written', () => {
    expect(referralLink('https://example.com', 'ABC123')).toBe(
      'https://example.com/auth/sign-up?ref=ABC123'
    );
    expect(referralLink('https://example.com/', 'abc123')).toBe(
      'https://example.com/auth/sign-up?ref=ABC123'
    );
  });

  it('escapes a code rather than trusting it in a query string', () => {
    expect(referralLink('https://example.com', 'a&b=c')).toBe(
      'https://example.com/auth/sign-up?ref=A%26B%3DC'
    );
  });
});

describe('formatCents', () => {
  it('renders integer cents without going via a float', () => {
    expect(formatCents(2500)).toBe('$25.00');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(99)).toBe('$0.99');
  });
});
