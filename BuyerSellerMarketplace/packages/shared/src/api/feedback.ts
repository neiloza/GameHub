import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import { feedbackResponseSchema, feedbackSchema } from '../schemas';
import type { FeedbackInput, FeedbackResponseInput } from '../schemas';
import type { FeedbackStatus } from '../constants';
import type { FeatureFeedback } from '../types/database';

/**
 * Product feedback from inside the product.
 *
 * The value of collecting it here rather than in a form somewhere is the
 * context: the surface, the route and the role come from where the member was
 * standing, so a report can be reproduced without asking them to describe the
 * page they were on.
 */

export async function submitFeedback(
  client: MarketplaceClient,
  input: FeedbackInput
): Promise<FeatureFeedback> {
  const parsed = feedbackSchema.parse(input);
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('feature_feedback')
    .insert({ profile_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

/** The caller's own submissions, so they can see what happened to them. */
export async function getMyFeedback(client: MarketplaceClient): Promise<FeatureFeedback[]> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await client
    .from('feature_feedback')
    .select('*')
    .eq('profile_id', auth.user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// --- admin ------------------------------------------------------------------

export async function listFeedback(
  client: MarketplaceClient,
  status?: FeedbackStatus
): Promise<FeatureFeedback[]> {
  let q = client.from('feature_feedback').select('*');
  if (status) q = q.eq('status', status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Answer a piece of feedback.
 *
 * The response is written where the person who sent it can read it — closing
 * the loop is most of why anybody sends a second one.
 */
export async function respondToFeedback(
  client: MarketplaceClient,
  id: string,
  input: FeedbackResponseInput
): Promise<FeatureFeedback> {
  const parsed = feedbackResponseSchema.parse(input);
  const responded_by = await requireUserId(client);
  const { data, error } = await client
    .from('feature_feedback')
    .update({ ...parsed, responded_by, responded_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return assertOk(data, error);
}
