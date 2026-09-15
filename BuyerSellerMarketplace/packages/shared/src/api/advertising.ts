import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import { advertiserProfileSchema, campaignSchema } from '../schemas';
import type { AdvertiserProfileInput, CampaignInput } from '../schemas';
import type { AdCampaign, Advertiser } from '../types/database';
import type { AdEventKind, AdPlacement } from '../constants';

/**
 * Advertising.
 *
 * An advertiser reaches their own listing, their own campaigns and their own
 * counts — and nothing that belongs to a buyer or a seller. That is enforced by
 * RLS; this module simply has no function that would ask for anything else.
 */

export async function getMyAdvertiser(client: MarketplaceClient): Promise<Advertiser | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from('advertisers')
    .select('*')
    .eq('profile_id', auth.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertMyAdvertiser(
  client: MarketplaceClient,
  input: AdvertiserProfileInput
): Promise<Advertiser> {
  const parsed = advertiserProfileSchema.parse(input);
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('advertisers')
    .upsert({ profile_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

export async function getMyCampaigns(client: MarketplaceClient): Promise<AdCampaign[]> {
  const { data, error } = await client
    .from('ad_campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCampaign(
  client: MarketplaceClient,
  input: CampaignInput
): Promise<AdCampaign> {
  const parsed = campaignSchema.parse(input);
  const advertiser_id = await requireUserId(client);
  const { data, error } = await client
    .from('ad_campaigns')
    .insert({ advertiser_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

/**
 * Pause or resume.
 *
 * An advertiser may move a campaign between `active` and `paused` and nowhere
 * else — `approved` is an administrator's decision, and the trigger refuses any
 * other transition from this side. Pausing is deliberately instant and
 * self-serve: an advertiser who wants their ad down now should not have to wait
 * for a person.
 */
export async function setCampaignPaused(
  client: MarketplaceClient,
  campaignId: string,
  paused: boolean
): Promise<AdCampaign> {
  const { data, error } = await client
    .from('ad_campaigns')
    .update({ status: paused ? 'paused' : 'active' })
    .eq('id', campaignId)
    .select()
    .single();
  return assertOk(data, error);
}

/** Live campaigns for one slot, ranked by budget. Readable by any signed-in member. */
export async function getActiveCampaigns(
  client: MarketplaceClient,
  placement: AdPlacement,
  limit = 1
): Promise<AdCampaign[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await client
    .from('ad_campaigns')
    .select('*')
    .eq('placement', placement)
    .eq('status', 'active')
    .lte('starts_on', today)
    .gte('ends_on', today)
    .order('budget_cents', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Record an impression or a click.
 *
 * Goes through a function rather than an insert so the viewer id is attached by
 * the database, from the session, rather than sent by the browser — which both
 * stops a campaign inflating its own numbers and means `ad_events` needs no
 * insert policy that would let one advertiser write rows against another's
 * campaign.
 */
export async function recordAdEvent(
  client: MarketplaceClient,
  campaignId: string,
  kind: AdEventKind
): Promise<void> {
  const { error } = await client.rpc('record_ad_event', {
    p_campaign_id: campaignId,
    p_kind: kind,
  });
  // Never surface this: a blocked or failed metric write must not break the
  // page the ad is on.
  if (error && process.env.NODE_ENV !== 'production') {
    console.warn('ad event not recorded:', error.message);
  }
}

export type CampaignCounts = { impressions: number; clicks: number };

/** Counts for one campaign. An advertiser reads numbers, never rows. */
export async function getCampaignCounts(
  client: MarketplaceClient,
  campaignId: string
): Promise<CampaignCounts> {
  const [impressions, clicks] = await Promise.all([
    client
      .from('ad_events')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('kind', 'impression'),
    client
      .from('ad_events')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('kind', 'click'),
  ]);
  if (impressions.error) throw new Error(impressions.error.message);
  if (clicks.error) throw new Error(clicks.error.message);
  return { impressions: impressions.count ?? 0, clicks: clicks.count ?? 0 };
}

/** The public directory of listed advertisers. */
export async function listDirectory(client: MarketplaceClient): Promise<Advertiser[]> {
  const { data, error } = await client
    .from('advertisers')
    .select('*')
    .eq('listed', true)
    .order('company_name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// --- admin ------------------------------------------------------------------

export async function listAllCampaigns(client: MarketplaceClient): Promise<AdCampaign[]> {
  const { data, error } = await client
    .from('ad_campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function approveCampaign(
  client: MarketplaceClient,
  campaignId: string
): Promise<AdCampaign> {
  const approved_by = await requireUserId(client);
  const { data, error } = await client
    .from('ad_campaigns')
    .update({ status: 'active', approved_by, approved_at: new Date().toISOString() })
    .eq('id', campaignId)
    .select()
    .single();
  return assertOk(data, error);
}

export async function setAdvertiserListed(
  client: MarketplaceClient,
  profileId: string,
  listed: boolean
): Promise<Advertiser> {
  const { data, error } = await client
    .from('advertisers')
    .update({ listed })
    .eq('profile_id', profileId)
    .select()
    .single();
  return assertOk(data, error);
}
