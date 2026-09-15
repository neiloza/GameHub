import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import type { OnboardingRole } from '../lib/onboarding';
import type { OnboardingCompletion } from '../types/database';

/**
 * First-run tour progress.
 *
 * Keyed on `(profile_id, role)` rather than on the profile, because one account
 * can gain a second role over its life — approving an application rewrites
 * `profiles.role` — and a single "onboarded" flag would swallow the second
 * walkthrough on the day that happens.
 */

export async function getMyOnboarding(
  client: MarketplaceClient
): Promise<OnboardingCompletion[]> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await client
    .from('onboarding_completions')
    .select('*')
    .eq('profile_id', auth.user.id);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Save the furthest step reached, so a tour closed halfway resumes there. */
export async function saveOnboardingStep(
  client: MarketplaceClient,
  role: OnboardingRole,
  step: number
): Promise<OnboardingCompletion> {
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('onboarding_completions')
    .upsert({ profile_id, role, last_step: step }, { onConflict: 'profile_id,role' })
    .select()
    .single();
  return assertOk(data, error);
}

/**
 * Settle a tour.
 *
 * `dismissed` records *which* of the two endings happened — finished or
 * skipped. Both stop the tour opening by itself, and keeping them apart is what
 * lets you tell "nobody needs this" from "everybody closes it".
 */
export async function finishOnboarding(
  client: MarketplaceClient,
  role: OnboardingRole,
  dismissed: boolean
): Promise<OnboardingCompletion> {
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('onboarding_completions')
    .upsert(
      { profile_id, role, dismissed, completed_at: new Date().toISOString() },
      { onConflict: 'profile_id,role' }
    )
    .select()
    .single();
  return assertOk(data, error);
}

/** Replay a tour: deleting the row is what makes it open again. */
export async function replayOnboarding(
  client: MarketplaceClient,
  role: OnboardingRole
): Promise<void> {
  const profile_id = await requireUserId(client);
  const { error } = await client
    .from('onboarding_completions')
    .delete()
    .eq('profile_id', profile_id)
    .eq('role', role);
  if (error) throw new Error(error.message);
}
