import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import type { Profile } from '../types/database';
import { onboardingSchema, profileSchema } from '../schemas';
import type { OnboardingInput, ProfileInput } from '../schemas';

export async function getMyProfile(client: MarketplaceClient): Promise<Profile | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getProfile(client: MarketplaceClient, id: string): Promise<Profile | null> {
  const { data, error } = await client.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Account setup: the row that turns an auth user into a member.
 *
 * `role` is not sent. The database forces a new profile to `buyer` and refuses
 * any later self-change (`protect_profile_privileged_columns`), so sending one
 * would be a value that is silently discarded — worse than not sending it,
 * because it reads as if it worked. Selling is applied for afterwards.
 */
export async function completeOnboarding(
  client: MarketplaceClient,
  input: OnboardingInput
): Promise<Profile> {
  const parsed = onboardingSchema.parse(input);
  const id = await requireUserId(client);
  const { data, error } = await client
    .from('profiles')
    .upsert({ id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

export async function updateMyProfile(
  client: MarketplaceClient,
  input: Omit<ProfileInput, 'role'>
): Promise<Profile> {
  const parsed = profileSchema.omit({ role: true }).parse(input);
  const id = await requireUserId(client);
  const { data, error } = await client
    .from('profiles')
    .update(parsed)
    .eq('id', id)
    .select()
    .single();
  return assertOk(data, error);
}
