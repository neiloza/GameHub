import type { MarketplaceClient } from './client';
import type { PurchasablePlan } from '../constants';
import type { BillingEvent, Membership } from '../types/database';

/**
 * Billing.
 *
 * Read-only from the app's point of view. Nothing here changes a membership or
 * grants a reward — the billing webhook does that, in one place, so a replayed
 * delivery from the payment processor cannot pay twice. The two mutating calls
 * below hand off to the processor's own hosted pages, which is also why no card
 * detail ever reaches this codebase.
 */

export async function getMyMembership(client: MarketplaceClient): Promise<Membership | null> {
  // No `.eq()` on the viewer: RLS restricts the table to the caller's own row.
  const { data, error } = await client.from('memberships').select('*').maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Open hosted checkout. Returns the URL to send the member to. */
export async function startMembershipCheckout(
  client: MarketplaceClient,
  returnUrl: string,
  plan: PurchasablePlan
): Promise<string> {
  const { data, error } = await client.functions.invoke<{ url: string }>('billing-checkout', {
    body: { return_url: returnUrl, plan },
  });
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('Could not start checkout');
  return data.url;
}

/** Open the hosted billing portal — card, invoices, and self-serve cancel. */
export async function openBillingPortal(
  client: MarketplaceClient,
  returnUrl: string
): Promise<string> {
  const { data, error } = await client.functions.invoke<{ url: string }>('billing-portal', {
    body: { return_url: returnUrl },
  });
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('Could not open the billing portal');
  return data.url;
}

/**
 * How many introductory seats are left.
 *
 * Readable by anyone, including a signed-out visitor: a cohort running out is
 * the whole point of it, and a number nobody can see creates none of the
 * urgency the pricing is built on.
 */
export async function introSeatsRemaining(client: MarketplaceClient): Promise<number> {
  const { data, error } = await client.rpc('intro_seats_remaining');
  if (error) throw new Error(error.message);
  return typeof data === 'number' ? data : 0;
}

// --- admin ------------------------------------------------------------------

export async function listMemberships(
  client: MarketplaceClient,
  limit = 200
): Promise<Membership[]> {
  const { data, error } = await client
    .from('memberships')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * The processor event log.
 *
 * Worth a screen of its own: when somebody says they paid and the app disagrees,
 * this is the record that settles it — what arrived, when, and whether we acted
 * on it. A row with an `error` and no `processed_at` is a webhook that failed
 * and is the first thing to look at.
 */
export async function listBillingEvents(
  client: MarketplaceClient,
  limit = 50
): Promise<BillingEvent[]> {
  const { data, error } = await client
    .from('billing_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
