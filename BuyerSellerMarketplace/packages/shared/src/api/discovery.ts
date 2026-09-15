import type { MarketplaceClient } from './client';
import { requireUserId } from './client';
import { swipeSchema } from '../schemas';
import type { SwipeInput } from '../schemas';
import type { Listing, Match } from '../types/database';

export type ScoredListing = Listing & { score: number };

/**
 * The buyer's feed.
 *
 * Ranked in the database by `get_discovery_feed()`, which is also what enforces
 * that only an approved buyer gets rows at all. `lib/matching.ts` mirrors the
 * arithmetic so a card can explain itself, but the order comes from here.
 */
export async function getDiscoveryFeed(
  client: MarketplaceClient,
  opts: { limit?: number; offset?: number } = {}
): Promise<ScoredListing[]> {
  const { data, error } = await client.rpc('get_discovery_feed', {
    p_limit: opts.limit ?? 20,
    p_offset: opts.offset ?? 0,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ScoredListing[];
}

/** Listings this buyer passed on, so a pass made by accident can be undone. */
export async function getSkippedListings(
  client: MarketplaceClient,
  limit = 20
): Promise<Listing[]> {
  const { data, error } = await client.rpc('get_skipped_feed', { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []) as Listing[];
}

/**
 * Record a swipe.
 *
 * Expressing interest does *not* open a chat: it writes a `matches` row in
 * `pending` for the seller to answer. That asymmetry is the trust model — see
 * `respondToMatch` for the other half.
 */
export async function swipe(client: MarketplaceClient, input: SwipeInput): Promise<void> {
  const parsed = swipeSchema.parse(input);
  const buyer_id = await requireUserId(client);
  const { error } = await client
    .from('swipes')
    .upsert({ buyer_id, ...parsed }, { onConflict: 'buyer_id,listing_id' });
  if (error) throw new Error(error.message);
}

/** Undo a pass, putting the listing back in the feed. */
export async function unskip(client: MarketplaceClient, listingId: string): Promise<void> {
  const buyer_id = await requireUserId(client);
  const { error } = await client
    .from('swipes')
    .delete()
    .eq('buyer_id', buyer_id)
    .eq('listing_id', listingId);
  if (error) throw new Error(error.message);
}

/** The interests waiting on a seller's answer, newest first. */
export async function getPendingMatches(
  client: MarketplaceClient,
  listingId: string
): Promise<Match[]> {
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('listing_id', listingId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** The buyer's own side: every interest they have expressed. */
export async function getMyMatches(client: MarketplaceClient): Promise<Match[]> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('buyer_id', auth.user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * The seller's answer. Accepting is what creates the conversation.
 *
 * Done in the database rather than here because accepting is two writes — the
 * match status and the conversation row — and a client that died between them
 * would leave a buyer told they matched with nowhere to talk. Returns the new
 * conversation id, or null on a decline.
 */
export async function respondToMatch(
  client: MarketplaceClient,
  matchId: string,
  accept: boolean
): Promise<string | null> {
  const { data, error } = await client.rpc('respond_to_match', {
    p_match_id: matchId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}

/** Block somebody. Hides both parties from each other everywhere at once. */
export async function blockProfile(client: MarketplaceClient, profileId: string): Promise<void> {
  const blocker_id = await requireUserId(client);
  const { error } = await client
    .from('blocks')
    .upsert({ blocker_id, blocked_id: profileId }, { onConflict: 'blocker_id,blocked_id' });
  if (error) throw new Error(error.message);
}

export async function unblockProfile(client: MarketplaceClient, profileId: string): Promise<void> {
  const blocker_id = await requireUserId(client);
  const { error } = await client
    .from('blocks')
    .delete()
    .eq('blocker_id', blocker_id)
    .eq('blocked_id', profileId);
  if (error) throw new Error(error.message);
}
