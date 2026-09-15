import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import { normalizeReferralCode } from '../lib/referrals';
import type { PromoterAccount, Referral, ReferralCode } from '../types/database';

/**
 * The promoter program.
 *
 * Nothing in this module grants or pays a reward: qualification happens in the
 * billing webhook, against a processor event we have already recorded, so a
 * replayed delivery cannot double-pay. Payouts are marked by an administrator
 * after money has actually moved, which happens off this platform — we never
 * ask for or store banking details.
 */

/** Mint (or fetch) the caller's referral code. Idempotent. */
export async function ensureMyReferralCode(client: MarketplaceClient): Promise<string> {
  const { data, error } = await client.rpc('ensure_my_referral_code', {});
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getMyReferralCode(
  client: MarketplaceClient
): Promise<ReferralCode | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from('referral_codes')
    .select('*')
    .eq('profile_id', auth.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getMyReferrals(client: MarketplaceClient): Promise<Referral[]> {
  const { data, error } = await client
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Attach a referral code to the signed-in account.
 *
 * Returns whether it took. Attribution is first-write-wins and never moves
 * afterwards — a second code on the same account is refused rather than
 * overwriting the first — and a self-referral is refused outright. Both
 * decisions are the database's, because both are the kind of rule a client can
 * be made to skip.
 */
export async function attributeSignup(
  client: MarketplaceClient,
  code: string
): Promise<boolean> {
  const { data, error } = await client.rpc('attribute_signup', {
    p_code: normalizeReferralCode(code),
  });
  if (error) throw new Error(error.message);
  return data === true;
}

export async function getMyPromoterAccount(
  client: MarketplaceClient
): Promise<PromoterAccount | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from('promoter_accounts')
    .select('*')
    .eq('profile_id', auth.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Sign the agreement. One of the two things standing between approved and active. */
export async function acceptPromoterAgreement(
  client: MarketplaceClient
): Promise<PromoterAccount> {
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('promoter_accounts')
    .update({ agreement_accepted_at: new Date().toISOString() })
    .eq('profile_id', profile_id)
    .select()
    .single();
  return assertOk(data, error);
}

// --- admin ------------------------------------------------------------------

export async function listPromoterAccounts(
  client: MarketplaceClient
): Promise<PromoterAccount[]> {
  const { data, error } = await client
    .from('promoter_accounts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Confirm that payment has been arranged.
 *
 * The other half of going active. Deliberately a human action: the money is set
 * up off-platform, so the only honest signal is an administrator saying they
 * have done it.
 */
export async function confirmPromoterPayment(
  client: MarketplaceClient,
  profileId: string
): Promise<PromoterAccount> {
  const { data, error } = await client
    .from('promoter_accounts')
    .update({ payment_confirmed_at: new Date().toISOString() })
    .eq('profile_id', profileId)
    .select()
    .single();
  return assertOk(data, error);
}

/** Settle a payout run. Returns how many referrals were marked paid. */
export async function markReferralsPaid(
  client: MarketplaceClient,
  referralIds: string[]
): Promise<number> {
  if (referralIds.length === 0) return 0;
  const { data, error } = await client.rpc('mark_referrals_paid', {
    p_referral_ids: referralIds,
  });
  if (error) throw new Error(error.message);
  return typeof data === 'number' ? data : 0;
}
