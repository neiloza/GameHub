// The one place a membership changes, and the one place a referral is paid.
//
// Everything here turns on a single rule: **record the event before acting on
// it.** `billing_events.event_id` is unique, so an insert that conflicts means
// this delivery has been seen before and must not be acted on again. Payment
// processors replay webhooks by design — on a timeout, on a retry, on a manual
// resend from their dashboard — and without this a replayed
// `invoice.payment_succeeded` would qualify the same referral four times and
// owe somebody four fees for one sale.
//
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.

import Stripe from 'npm:stripe@17';
import { adminClient, json } from '../_shared/supabase.ts';

/** Processor subscription statuses, mapped to our membership states. */
function stateFor(status: string): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'none';
  }
}

const HANDLED = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

Deno.serve(async (req) => {
  // No CORS headers and no OPTIONS branch: this endpoint is called by the
  // processor's servers, never by a browser. Advertising it to one would be
  // inviting a forged POST from a page we do not control.
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret || !webhookSecret) return json({ error: 'billing is not configured' }, 503);

  const stripe = new Stripe(secret, { apiVersion: '2024-12-18.acacia' });
  const signature = req.headers.get('stripe-signature');
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    // The raw body, not the parsed one: the signature is over the bytes.
    event = await stripe.webhooks.constructEventAsync(raw, signature!, webhookSecret);
  } catch (e) {
    // An unverifiable payload is not an error on our side — it is somebody
    // posting to a public URL. 400, and nothing is written.
    return json({ error: `signature verification failed: ${(e as Error).message}` }, 400);
  }

  const admin = adminClient();

  // Claim the event. A conflict means we have already seen this delivery.
  const { error: claimError } = await admin
    .from('billing_events')
    .insert({ event_id: event.id, kind: event.type, payload: event as unknown as object });

  if (claimError) {
    // 200 rather than an error: from the processor's point of view this
    // delivery succeeded, and returning anything else asks them to retry it.
    return json({ received: true, duplicate: true });
  }

  if (!HANDLED.has(event.type)) {
    await admin
      .from('billing_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.id);
    return json({ received: true, ignored: true });
  }

  try {
    await handle(admin, stripe, event);
    await admin
      .from('billing_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.id);
  } catch (e) {
    // Leave `processed_at` null and record why. The row is the record that this
    // delivery arrived and was not acted on, which is what the admin billing
    // screen surfaces when somebody says they paid and the app disagrees.
    await admin
      .from('billing_events')
      .update({ error: (e as Error).message })
      .eq('event_id', event.id);
    return json({ error: 'handler failed' }, 500);
  }

  return json({ received: true });
});

async function handle(
  admin: ReturnType<typeof adminClient>,
  stripe: Stripe,
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const profileId = session.metadata?.profile_id;
      if (!profileId || !session.subscription) return;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await upsertMembership(admin, profileId, subscription, session.metadata?.plan);
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const profileId = subscription.metadata?.profile_id;
      if (!profileId) return;
      await upsertMembership(admin, profileId, subscription, subscription.metadata?.plan);
      return;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) return;

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const profileId = subscription.metadata?.profile_id;
      if (!profileId) return;

      await upsertMembership(admin, profileId, subscription, subscription.metadata?.plan);

      // A referral qualifies on money actually moving, not on signup — an
      // abandoned checkout earns nothing, and a refund can disqualify it later.
      await admin
        .from('referrals')
        .update({ status: 'qualified', qualified_at: new Date().toISOString() })
        .eq('referred_id', profileId)
        .eq('status', 'pending');

      await admin.rpc('notify_profile', {
        p_profile_id: profileId,
        p_kind: 'membership_started',
        p_payload: {},
      });
      return;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) return;

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const profileId = subscription.metadata?.profile_id;
      if (!profileId) return;

      await admin
        .from('memberships')
        .update({ state: 'past_due' })
        .eq('profile_id', profileId);

      await admin.rpc('notify_profile', {
        p_profile_id: profileId,
        p_kind: 'membership_trouble',
        p_payload: {},
      });
      return;
    }
  }
}

async function upsertMembership(
  admin: ReturnType<typeof adminClient>,
  profileId: string,
  subscription: Stripe.Subscription,
  plan?: string
): Promise<void> {
  const { error } = await admin.from('memberships').upsert(
    {
      profile_id: profileId,
      // The plan travels in metadata from checkout. On a later event we may not
      // have it, and overwriting a known plan with 'none' would be worse than
      // leaving the old value, so it is only set when present.
      ...(plan ? { plan } : {}),
      state: stateFor(subscription.status),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      processor_customer_id: subscription.customer as string,
      processor_subscription_id: subscription.id,
    },
    { onConflict: 'profile_id' }
  );
  if (error) throw new Error(error.message);
}
