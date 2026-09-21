import type { RealtimeChannel } from '@supabase/supabase-js';
import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import { enquirySchema, messageSchema, reportSchema } from '../schemas';
import type { EnquiryInput, ReportInput } from '../schemas';
import type { Conversation, Listing, Message, Report } from '../types/database';

export type ConversationSummary = Conversation & {
  listings: Pick<Listing, 'id' | 'name' | 'owner_id' | 'cover_image_url' | 'price_cents' | 'currency'>;
};

/**
 * Open an enquiry about a listing, or add to the thread that already exists.
 *
 * This is the *only* way a conversation comes into being, and it can only ever
 * be called by the person who becomes the buyer on it. A seller has no
 * equivalent: they answer threads, they do not start them. See the INSERT
 * policy on `conversations` — the rule is a policy, not a convention.
 *
 * Returns the conversation id, new or existing.
 */
export async function startEnquiry(
  client: MarketplaceClient,
  input: EnquiryInput
): Promise<string> {
  const parsed = enquirySchema.parse(input);
  const { data, error } = await client.rpc('start_enquiry', {
    p_listing_id: parsed.listing_id,
    p_body: parsed.body,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/** The thread for one listing and the signed-in shopper, if there is one. */
export async function getMyEnquiry(
  client: MarketplaceClient,
  listingId: string
): Promise<Conversation | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from('conversations')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_id', auth.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Every enquiry on one listing. The seller's side of the inbox. */
export async function getListingEnquiries(
  client: MarketplaceClient,
  listingId: string
): Promise<Conversation[]> {
  const { data, error } = await client
    .from('conversations')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Every conversation this account is part of.
 *
 * No `.eq()` on the viewer: RLS already restricts the table to conversations
 * the caller participates in, and adding a filter here would quietly become the
 * *only* thing keeping the rows apart if that policy were ever loosened. Let
 * the database be the boundary and read what it returns.
 */
export async function getConversations(client: MarketplaceClient): Promise<ConversationSummary[]> {
  const { data, error } = await client
    .from('conversations')
    .select('*, listings(id, name, owner_id, cover_image_url, price_cents, currency)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ConversationSummary[];
}

export async function getConversation(
  client: MarketplaceClient,
  id: string
): Promise<ConversationSummary | null> {
  const { data, error } = await client
    .from('conversations')
    .select('*, listings(id, name, owner_id, cover_image_url, price_cents, currency)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as ConversationSummary | null;
}

export async function getMessages(
  client: MarketplaceClient,
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendMessage(
  client: MarketplaceClient,
  conversationId: string,
  body: string
): Promise<Message> {
  const parsed = messageSchema.parse({ conversation_id: conversationId, body });
  const sender_id = await requireUserId(client);
  const { data, error } = await client
    .from('messages')
    .insert({ conversation_id: parsed.conversation_id, sender_id, body: parsed.body })
    .select()
    .single();
  return assertOk(data, error);
}

/**
 * Mark everything up to now as read.
 *
 * A function rather than an update because the column differs by side — the
 * buyer writes `buyer_last_read_at`, the seller `seller_last_read_at` — and
 * deciding that here would mean the client knowing which side it is on for a
 * write the database can work out for itself.
 */
export async function markConversationRead(
  client: MarketplaceClient,
  conversationId: string
): Promise<void> {
  const { error } = await client.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) throw new Error(error.message);
}

/**
 * Subscribe to new messages in one conversation.
 *
 * Returns the channel; the caller removes it on unmount. Realtime respects RLS,
 * so a subscription to someone else's conversation receives nothing rather than
 * erroring — which is why the filter below is for efficiency, not for privacy.
 */
export function subscribeToMessages(
  client: MarketplaceClient,
  conversationId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  return client
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Message)
    )
    .subscribe();
}

export async function reportSomething(
  client: MarketplaceClient,
  input: ReportInput
): Promise<Report> {
  const parsed = reportSchema.parse(input);
  const reporter_id = await requireUserId(client);
  const { data, error } = await client
    .from('reports')
    .insert({ reporter_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}
