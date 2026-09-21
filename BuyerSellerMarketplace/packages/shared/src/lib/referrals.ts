import { REFERRAL_FEE_CENTS, MIN_PAYOUT_CENTS } from '../constants';
import type { ReferralStatus } from '../constants';

/**
 * Promoter earnings roll-ups.
 *
 * Nothing here grants a reward — the billing webhook does that, in one place,
 * so a replayed processor event cannot double-pay. These functions only read
 * rows the database already decided about, which is why they are pure and
 * testable and why the fee is taken from the row rather than recomputed: a
 * referral records the fee that was in force the day it qualified, and changing
 * `REFERRAL_FEE_CENTS` must not retroactively repay past referrals.
 */

export type ReferralLike = { status: ReferralStatus; fee_cents: number };

export type EarningsSummary = {
  signedUp: number;
  converted: number;
  paid: number;
  disqualified: number;
  /**
   * Signed up but not yet a qualified conversion — nothing is owed on these and
   * they may never become owed, which is why they are counted apart from
   * `owedCents` rather than added to it.
   */
  pendingCents: number;
  /** Earned, past the refund window, not yet paid out. */
  owedCents: number;
  paidCents: number;
  lifetimeCents: number;
  /** True when the balance has reached the threshold a payout run uses. */
  payoutReady: boolean;
};

export function summarizeEarnings(referrals: ReferralLike[]): EarningsSummary {
  const byStatus = (s: ReferralStatus) => referrals.filter((r) => r.status === s);
  const sum = (rows: ReferralLike[]) => rows.reduce((t, r) => t + r.fee_cents, 0);

  const qualified = byStatus('qualified');
  const paid = byStatus('paid');
  const owedCents = sum(qualified);

  return {
    signedUp: referrals.length,
    converted: qualified.length + paid.length,
    paid: paid.length,
    disqualified: byStatus('disqualified').length,
    pendingCents: sum(byStatus('pending')),
    owedCents,
    paidCents: sum(paid),
    lifetimeCents: owedCents + sum(paid),
    payoutReady: owedCents >= MIN_PAYOUT_CENTS,
  };
}

/** What a referral is worth the moment it is created. */
export function feeForNewReferral(): number {
  return REFERRAL_FEE_CENTS;
}

/**
 * Normalise a code the way the database does before comparing, so the UI can
 * tell somebody their code is unknown without a round trip.
 */
export function normalizeReferralCode(input: string): string {
  return input.trim().toUpperCase();
}

/** The shareable link for a promoter or member referral code. */
export function referralLink(baseUrl: string, code: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/auth/sign-up?ref=${encodeURIComponent(normalizeReferralCode(code))}`;
}

/**
 * Money for display. Integer cents in, a string out — never a float in between.
 *
 * `Intl` rounds, and rounding a number that is already exact is harmless; what
 * is not harmless is doing arithmetic on the way here. Every caller passes the
 * cents it read from the database.
 */
export function formatCents(cents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
