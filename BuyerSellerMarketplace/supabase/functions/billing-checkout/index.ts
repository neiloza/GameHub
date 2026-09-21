// Open hosted checkout for a membership.
//
// This function only opens the checkout. It grants nothing — the membership row
// and every reward are written by `billing-webhook` once the processor confirms
// the payment, so an abandoned checkout leaves no trace of entitlement.
//
// Env: STRIPE_SECRET_KEY, SITE_URL, and one price id per plan:
//   STRIPE_PRICE_INTRO_MONTHLY
//   STRIPE_PRICE_INTRO_ANNUAL
//   STRIPE_PRICE_STANDARD_MONTHLY
//   STRIPE_PRICE_STANDARD_ANNUAL
//
// Only the plan being bought has to be configured: a project that has created
// two of the four prices can sell those two and returns a clear error for the
// others, rather than failing to start.

import Stripe from 'npm:stripe@17';
import { adminClient, corsHeaders, json, safeReturnUrl, userClient } from '../_shared/supabase.ts';

/**
 * The plans, and the environment variable holding each one's price.
 *
 * Mirrors PURCHASABLE_PLANS in packages/shared/src/constants.ts. An edge
 * function cannot import from the workspace, so the list is repeated here and
 * kept in step by hand — the same arrangement as the listing cap and its
 * trigger.
 */
const PLAN_PRICE_ENV = {
  intro_monthly: 'STRIPE_PRICE_INTRO_MONTHLY',
  intro_annual: 'STRIPE_PRICE_INTRO_ANNUAL',
  standard_monthly: 'STRIPE_PRICE_STANDARD_MONTHLY',
  standard_annual: 'STRIPE_PRICE_STANDARD_ANNUAL',
} as const;

type PurchasablePlan = keyof typeof PLAN_PRICE_ENV;

const PURCHASABLE_PLANS = Object.keys(PLAN_PRICE_ENV) as PurchasablePlan[];

/**
 * What an introductory plan becomes once the cohort is full.
 *
 * The membership page only offers the intro plans while `intro_seats_remaining()`
 * is above zero — but that is a UI decision and this endpoint is reachable
 * directly. Selling seat 401 at the intro rate is a price we would then have to
 * honour for as long as they stay a member, so the check is made here too,
 * against the database rather than against the caller's claim.
 */
const STANDARD_EQUIVALENT: Record<PurchasablePlan, PurchasablePlan> = {
  intro_monthly: 'standard_monthly',
  intro_annual: 'standard_annual',
  standard_monthly: 'standard_monthly',
  standard_annual: 'standard_annual',
};

function isPurchasablePlan(value: unknown): value is PurchasablePlan {
  return typeof value === 'string' && (PURCHASABLE_PLANS as string[]).includes(value);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) return json({ error: 'billing is not configured' }, 503);

  const body = await req.json().catch(() => ({}));

  const supabase = userClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'not signed in' }, 401);

  if (!isPurchasablePlan(body?.plan)) return json({ error: 'unknown plan' }, 400);

  const admin = adminClient();

  // Ask the database, not the caller, whether the intro rate is still open.
  let plan: PurchasablePlan = body.plan;
  if (plan.startsWith('intro_')) {
    const { data: remaining } = await admin.rpc('intro_seats_remaining');
    if (typeof remaining !== 'number' || remaining <= 0) {
      plan = STANDARD_EQUIVALENT[plan];
    }
  }

  const price = Deno.env.get(PLAN_PRICE_ENV[plan]);
  if (!price) return json({ error: `no price configured for ${plan}` }, 503);

  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';
  const returnUrl = safeReturnUrl(siteUrl, body?.return_url ?? '/membership');

  const stripe = new Stripe(secret, { apiVersion: '2024-12-18.acacia' });

  // Reuse the customer if we have one, so a member who has paid before does not
  // end up with two customer records and two payment methods on file.
  const { data: membership } = await admin
    .from('memberships')
    .select('processor_customer_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer: membership?.processor_customer_id ?? undefined,
    customer_email: membership?.processor_customer_id ? undefined : (user.email ?? undefined),
    success_url: `${returnUrl}?checkout=success`,
    cancel_url: `${returnUrl}?checkout=cancelled`,
    // The webhook has no session context, so everything it needs to write the
    // right row travels with the subscription itself.
    subscription_data: { metadata: { profile_id: user.id, plan } },
    metadata: { profile_id: user.id, plan },
  });

  if (!session.url) return json({ error: 'could not start checkout' }, 502);
  return json({ url: session.url });
});
