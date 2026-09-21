// Start an identity check at the provider.
//
// What this function does not do is the design: it never receives, forwards or
// stores a document, an image or a government number. The member is sent to the
// provider's own hosted flow, and all we keep is the session id and, later, the
// outcome. If this database is ever breached, the thing a verified member most
// needs protected was never in it.
//
// Env: STRIPE_SECRET_KEY, SITE_URL.

import Stripe from 'npm:stripe@17';
import { adminClient, corsHeaders, json, safeReturnUrl, userClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) return json({ error: 'identity verification is not configured' }, 503);

  const supabase = userClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'not signed in' }, 401);

  const body = await req.json().catch(() => ({}));
  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';

  const stripe = new Stripe(secret, { apiVersion: '2024-12-18.acacia' });
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { profile_id: user.id },
    return_url: safeReturnUrl(siteUrl, body?.return_url ?? '/settings'),
  });

  // Recorded as pending so the settings page can say "we are waiting on this"
  // rather than showing nothing until the webhook arrives.
  const admin = adminClient();
  await admin.rpc('handle_identity_outcome', {
    p_profile_id: user.id,
    p_session_id: session.id,
    p_status: 'pending',
    p_reason: null,
  });

  if (!session.url) return json({ error: 'could not start verification' }, 502);
  return json({ url: session.url });
});
