// Open the processor's hosted billing portal — card, invoices, self-serve cancel.
//
// Nothing about a membership changes here. A cancellation made in the portal
// reaches us as a webhook like any other change, which is what keeps one
// codepath responsible for the membership row.

import Stripe from 'npm:stripe@17';
import { adminClient, corsHeaders, json, safeReturnUrl, userClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) return json({ error: 'billing is not configured' }, 503);

  const supabase = userClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'not signed in' }, 401);

  const admin = adminClient();
  const { data: membership } = await admin
    .from('memberships')
    .select('processor_customer_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!membership?.processor_customer_id) {
    return json({ error: 'no billing account yet' }, 404);
  }

  const body = await req.json().catch(() => ({}));
  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';

  const stripe = new Stripe(secret, { apiVersion: '2024-12-18.acacia' });
  const session = await stripe.billingPortal.sessions.create({
    customer: membership.processor_customer_id,
    return_url: safeReturnUrl(siteUrl, body?.return_url ?? '/membership'),
  });

  return json({ url: session.url });
});
