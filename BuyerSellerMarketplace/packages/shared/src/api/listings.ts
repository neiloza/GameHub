import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import { listingSchema } from '../schemas';
import type { ListingInput } from '../schemas';
import type { Listing } from '../types/database';

export async function getMyListings(client: MarketplaceClient): Promise<Listing[]> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await client
    .from('listings')
    .select('*')
    .eq('owner_id', auth.user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getListing(client: MarketplaceClient, id: string): Promise<Listing | null> {
  const { data, error } = await client.from('listings').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createListing(
  client: MarketplaceClient,
  input: ListingInput
): Promise<Listing> {
  const parsed = listingSchema.parse(input);
  const owner_id = await requireUserId(client);
  const { data, error } = await client
    .from('listings')
    .insert({ owner_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

export async function updateListing(
  client: MarketplaceClient,
  id: string,
  input: ListingInput
): Promise<Listing> {
  const parsed = listingSchema.parse(input);
  const { data, error } = await client
    .from('listings')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();
  return assertOk(data, error);
}

/**
 * Publish or unpublish.
 *
 * Kept apart from `updateListing` because it is the one field a seller changes
 * on its own, from a button rather than a form, and because a suspended listing
 * must not be republished by its owner — the trigger refuses it, and going
 * through the full form would make that refusal look like a validation error on
 * a field the seller did not touch.
 */
export async function setListingPublished(
  client: MarketplaceClient,
  id: string,
  published: boolean
): Promise<Listing> {
  const { data, error } = await client
    .from('listings')
    .update({ status: published ? 'published' : 'draft' })
    .eq('id', id)
    .select()
    .single();
  return assertOk(data, error);
}

export async function deleteListing(client: MarketplaceClient, id: string): Promise<void> {
  const { error } = await client.from('listings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
