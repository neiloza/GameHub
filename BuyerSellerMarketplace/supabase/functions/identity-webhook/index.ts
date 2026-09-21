// Record the outcome of an identity check.
//
// `handle_identity_outcome()` is what writes `profiles.verified`, and it is
// reachable only from here and from the service role: the profile guard refuses
// that column to every member, administrators included, because a verified
// badge somebody can award themselves is not a verification.
//
// Env: STRIPE_SECRET_KEY, STRIPE_IDENTITY_WEBHOOK_SECRET.

import Stripe from 'npm:stripe@17';
import { adminClient, json } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_IDENTITY_WEBHOOK_SECRET');
  if (!secret || !webhookSecret) {
    return json({ error: 'identity verification is not configured' }, 503);
  }

  const stripe = new Stripe(secret, { apiVersion: '2024-12-18.acacia' });
  const signature = req.headers.get('stripe-signature');
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature!, webhookSecret);
  } catch (e) {
    return json({ error: `signature verification failed: ${(e as Error).message}` }, 400);
  }

  const session = event.data.object as Stripe.Identity.VerificationSession;
  const profileId = session.metadata?.profile_id;
  if (!profileId) return json({ received: true, ignored: true });

  const admin = adminClient();

  if (event.type === 'identity.verification_session.verified') {
    await admin.rpc('handle_identity_outcome', {
      p_profile_id: profileId,
      p_session_id: session.id,
      p_status: 'verified',
      p_reason: null,
    });
  } else if (
    event.type === 'identity.verification_session.requires_input' ||
    event.type === 'identity.verification_session.canceled'
  ) {
    await admin.rpc('handle_identity_outcome', {
      p_profile_id: profileId,
      p_session_id: session.id,
      p_status: 'failed',
      // The provider's own reason code, not the document it came from. Enough
      // to tell the member what to try next and nothing more.
      p_reason: session.last_error?.reason ?? null,
    });
  }

  return json({ received: true });
});
