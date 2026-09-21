import type { MarketplaceClient } from './client';
import type { IdentityVerification } from '../types/database';

/**
 * Identity verification.
 *
 * The whole point of the design is what it does *not* store: the check runs at
 * the provider, we keep a session id and an outcome, and no document, image,
 * scan or government number ever reaches this database. `profiles.verified` is
 * set by the webhook and is not writable by the member — see
 * `protect_profile_privileged_columns`.
 */

export async function getMyVerification(
  client: MarketplaceClient
): Promise<IdentityVerification | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from('identity_verifications')
    .select('*')
    .eq('profile_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Start a check. Returns the provider-hosted URL to send the member to. */
export async function startVerification(
  client: MarketplaceClient,
  returnUrl: string
): Promise<string> {
  const { data, error } = await client.functions.invoke<{ url: string }>('identity-verify', {
    body: { return_url: returnUrl },
  });
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('Could not start verification');
  return data.url;
}
