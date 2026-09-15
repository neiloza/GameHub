import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import {
  advertiserApplicationSchema,
  applicationMessageSchema,
  applicationReviewSchema,
  buyerApplicationSchema,
  promoterApplicationSchema,
} from '../schemas';
import type {
  AdvertiserApplicationInput,
  ApplicationReviewInput,
  BuyerApplicationInput,
  PromoterApplicationInput,
} from '../schemas';
import type { ApplicationStatus } from '../constants';
import type {
  AdvertiserApplication,
  ApplicationKind,
  ApplicationMessage,
  ApplicationNote,
  BuyerApplication,
  PromoterApplication,
} from '../types/database';

/**
 * Three application tables, one workflow.
 *
 * They are separate tables rather than one with a `kind` column because their
 * payloads have nothing in common past the contact block — a buyer states a
 * budget, an advertiser states placements, a promoter states channels — and a
 * single table would be a wide sheet of columns that are null for two kinds out
 * of three, with CHECK constraints to say which. The shared *workflow* (submit,
 * question, answer, decide) lives here and in `review_application()`.
 */
const TABLES = {
  buyer: 'buyer_applications',
  advertiser: 'advertiser_applications',
  promoter: 'promoter_applications',
} as const satisfies Record<ApplicationKind, string>;

export type AnyApplication = BuyerApplication | AdvertiserApplication | PromoterApplication;

export async function submitBuyerApplication(
  client: MarketplaceClient,
  input: BuyerApplicationInput
): Promise<BuyerApplication> {
  const parsed = buyerApplicationSchema.parse(input);
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('buyer_applications')
    .insert({ profile_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

export async function submitAdvertiserApplication(
  client: MarketplaceClient,
  input: AdvertiserApplicationInput
): Promise<AdvertiserApplication> {
  const parsed = advertiserApplicationSchema.parse(input);
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('advertiser_applications')
    .insert({ profile_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

export async function submitPromoterApplication(
  client: MarketplaceClient,
  input: PromoterApplicationInput
): Promise<PromoterApplication> {
  const parsed = promoterApplicationSchema.parse(input);
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('promoter_applications')
    .insert({ profile_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

/** The caller's own application of one kind, if they have one. */
export async function getMyApplication(
  client: MarketplaceClient,
  kind: ApplicationKind
): Promise<AnyApplication | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from(TABLES[kind])
    .select('*')
    .eq('profile_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as AnyApplication | null;
}

/** Admin: the review queue for one kind, oldest first — a queue, not a feed. */
export async function listApplications(
  client: MarketplaceClient,
  kind: ApplicationKind,
  status?: ApplicationStatus
): Promise<AnyApplication[]> {
  let q = client.from(TABLES[kind]).select('*');
  if (status) q = q.eq('status', status);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AnyApplication[];
}

/**
 * Decide an application.
 *
 * Approving is what grants the role, so it runs in the database as a security
 * definer function: `profiles.role` is guarded against self-change, and this is
 * the only path that is allowed past that guard. Doing it with a plain update
 * from here would mean loosening the guard for everybody.
 */
export async function reviewApplication(
  client: MarketplaceClient,
  kind: ApplicationKind,
  applicationId: string,
  input: ApplicationReviewInput
): Promise<void> {
  const parsed = applicationReviewSchema.parse(input);
  const { error } = await client.rpc('review_application', {
    p_kind: kind,
    p_application_id: applicationId,
    p_status: parsed.status,
    p_note: parsed.note ?? null,
  });
  if (error) throw new Error(error.message);
}

// --- the thread between applicant and reviewer ------------------------------

export async function getApplicationMessages(
  client: MarketplaceClient,
  kind: ApplicationKind,
  applicationId: string
): Promise<ApplicationMessage[]> {
  const { data, error } = await client
    .from('application_messages')
    .select('*')
    .eq('application_kind', kind)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendApplicationMessage(
  client: MarketplaceClient,
  kind: ApplicationKind,
  applicationId: string,
  body: string
): Promise<ApplicationMessage> {
  const parsed = applicationMessageSchema.parse({ application_id: applicationId, body });
  const author_id = await requireUserId(client);
  const { data, error } = await client
    .from('application_messages')
    .insert({
      application_kind: kind,
      application_id: parsed.application_id,
      author_id,
      body: parsed.body,
    })
    .select()
    .single();
  return assertOk(data, error);
}

/**
 * Reviewer-only notes.
 *
 * A different table from `application_messages` on purpose: the applicant can
 * read their thread, and a note written in the same table would be one RLS
 * mistake away from being read by the person it is about. Separate tables make
 * that a schema property rather than a policy detail.
 */
export async function getApplicationNotes(
  client: MarketplaceClient,
  kind: ApplicationKind,
  applicationId: string
): Promise<ApplicationNote[]> {
  const { data, error } = await client
    .from('application_notes')
    .select('*')
    .eq('application_kind', kind)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addApplicationNote(
  client: MarketplaceClient,
  kind: ApplicationKind,
  applicationId: string,
  body: string
): Promise<ApplicationNote> {
  const author_id = await requireUserId(client);
  const { data, error } = await client
    .from('application_notes')
    .insert({ application_kind: kind, application_id: applicationId, author_id, body })
    .select()
    .single();
  return assertOk(data, error);
}
