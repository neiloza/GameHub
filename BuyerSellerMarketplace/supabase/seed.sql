-- Development seed.
--
-- Enough of every role to walk the whole product, and enough of the awkward
-- states — an unapproved buyer, a suspended listing, a past_due membership,
-- a promoter who has signed the agreement but has no payment confirmed — that
-- the screens which handle them can actually be seen.
--
-- Every password is `password123`. Never run this against anything real.
--
-- Fixture ids are fixed and readable so the RLS tests can reference them by
-- name rather than looking them up: `a` for admin, `s` for seller, `b` for
-- buyer, `d` for advertiser, `p` for promoter.

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

insert into auth.users (id, email)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.dev'),
  ('55555555-0000-4000-8000-000000000001', 'seller1@example.dev'),
  ('55555555-0000-4000-8000-000000000002', 'seller2@example.dev'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'buyer1@example.dev'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'buyer2@example.dev'),
  ('dddddddd-0000-4000-8000-000000000001', 'advertiser1@example.dev'),
  ('cccccccc-0000-4000-8000-000000000001', 'promoter1@example.dev'),
  ('cccccccc-0000-4000-8000-000000000002', 'promoter2@example.dev')
on conflict (id) do nothing;

-- Runs as the service role, where auth.uid() is null, so
-- protect_profile_privileged_columns() lets the roles and flags through.
insert into public.profiles (id, role, display_name, location, bio, verified, is_admin)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'seller', 'Ada (admin)', 'Remote',
   'Runs the console.', true, true),

  ('55555555-0000-4000-8000-000000000001', 'seller', 'Blue Door Bakery', 'Austin, TX',
   'Sourdough and pastry, wholesale and retail.', true, false),
  ('55555555-0000-4000-8000-000000000002', 'seller', 'Harbour Metalworks', 'Portland, ME',
   'Small-run fabrication.', false, false),

  ('bbbbbbbb-0000-4000-8000-000000000001', 'buyer', 'Rivera Holdings', 'Austin, TX',
   'Acquires local food and beverage operations.', true, false),
  -- Applied, not yet approved: is_approved_buyer() is false, so the feed is
  -- empty for them. The screen that says so is worth being able to see.
  ('bbbbbbbb-0000-4000-8000-000000000002', 'buyer', 'Okonkwo Partners', 'Chicago, IL',
   'Waiting on review.', false, false),

  ('dddddddd-0000-4000-8000-000000000001', 'advertiser', 'Ledger & Co', 'Remote',
   'Bookkeeping for small operators.', false, false),

  ('cccccccc-0000-4000-8000-000000000001', 'promoter', 'The Small Print', 'Remote',
   'Newsletter about buying and selling small businesses.', false, false),
  -- Approved but not yet active: agreement signed, payment not confirmed.
  ('cccccccc-0000-4000-8000-000000000002', 'promoter', 'Corner Shop Radio', 'Remote',
   'Podcast. Halfway through setup.', false, false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------

insert into public.memberships (profile_id, plan, state, current_period_end, processor_customer_id)
values
  ('55555555-0000-4000-8000-000000000001', 'intro_annual', 'active', now() + interval '300 days', 'cus_seed_1'),
  -- Payment failing. The banner, the reconciliation row and the "fix your card"
  -- path all hang off this one row.
  ('55555555-0000-4000-8000-000000000002', 'standard_monthly', 'past_due', now() + interval '3 days', 'cus_seed_2'),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'standard_annual', 'active', now() + interval '200 days', 'cus_seed_a')
on conflict (profile_id) do nothing;

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------

insert into public.listings
  (id, owner_id, name, tagline, category, stage, location, summary, price_cents, status)
values
  ('11111111-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000001',
   'Blue Door Bakery', 'Two locations, eleven years, one owner ready to retire',
   'food_beverage', 'established', 'Austin, TX',
   'Wholesale accounts with fourteen restaurants and a retail front.',
   45000000, 'published'),

  ('11111111-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000001',
   'Bakery Wholesale Route', 'The delivery half, on its own',
   'logistics_transport', 'established', 'Austin, TX',
   'Van, route and the accounts that come with it.',
   9000000, 'published'),

  -- A draft: nobody but its owner and an administrator can see this row, which
  -- is the one thing worth testing about drafts.
  ('11111111-0000-4000-8000-000000000003', '55555555-0000-4000-8000-000000000001',
   'Third Location (draft)', 'Not ready yet',
   'food_beverage', 'concept', 'Austin, TX',
   'Site found, lease not signed.',
   null, 'draft'),

  ('11111111-0000-4000-8000-000000000004', '55555555-0000-4000-8000-000000000002',
   'Harbour Metalworks', 'Small-run fabrication, marine and architectural',
   'industrial_manufacturing', 'established', 'Portland, ME',
   'Two CNC machines, a welding bay and a twenty-year customer list.',
   28000000, 'published'),

  -- Suspended by an administrator. Its owner cannot republish it — the trigger
  -- refuses — which is the point of having the state at all.
  ('11111111-0000-4000-8000-000000000005', '55555555-0000-4000-8000-000000000002',
   'Too Good To Be True Ltd', 'Guaranteed 900% returns',
   'financial_services', 'concept', 'Nowhere',
   'Reported and suspended.',
   100, 'suspended')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------

insert into public.buyer_applications
  (id, profile_id, contact_name, contact_email, motivation, buyer_type, organization,
   categories, budget_min_cents, budget_max_cents, status, reviewed_by, reviewed_at)
values
  ('22222222-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Sam Rivera', 'sam@rivera.example', 'We buy and hold local food businesses.',
   'business', 'Rivera Holdings', array['food_beverage', 'hospitality_travel'],
   10000000, 80000000, 'approved',
   'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '20 days'),

  ('22222222-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002',
   'Ada Okonkwo', 'ada@okonkwo.example', 'Looking for a first acquisition.',
   'individual', null, array['software_technology'],
   null, 20000000, 'pending', null, null)
on conflict (id) do nothing;

insert into public.advertiser_applications
  (id, profile_id, contact_name, contact_email, motivation, company_name, website,
   placements, status, reviewed_by, reviewed_at)
values
  ('33333333-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   'Jo Ledger', 'jo@ledger.example', 'Our customers are exactly your sellers.',
   'Ledger & Co', 'https://ledger.example', array['discovery_feed', 'dashboard'],
   'approved', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '14 days')
on conflict (id) do nothing;

insert into public.promoter_applications
  (id, profile_id, contact_name, contact_email, motivation, promoter_type, platforms,
   audience_size, estimated_monthly_referrals, status, reviewed_by, reviewed_at)
values
  ('44444444-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001',
   'Kit Marlow', 'kit@smallprint.example', 'I write to 9,000 people about this every week.',
   'creator', array['newsletter', 'website'], 9000, '10_to_50',
   'approved', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '30 days'),

  ('44444444-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002',
   'Noor Haddad', 'noor@cornershop.example', 'Weekly show, mostly first-time buyers.',
   'creator', array['podcast'], 2500, 'under_10',
   'approved', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '6 days')
on conflict (id) do nothing;

-- The trigger on promoter_applications only fires on UPDATE, and these rows
-- were inserted already-approved, so the accounts are created here.
insert into public.promoter_accounts (profile_id, agreement_accepted_at, payment_confirmed_at)
values
  ('cccccccc-0000-4000-8000-000000000001', now() - interval '29 days', now() - interval '28 days'),
  -- Signed, not yet paid-setup: active is generated false. This is the state
  -- the promoter portal's "two steps to go" screen exists for.
  ('cccccccc-0000-4000-8000-000000000002', now() - interval '5 days', null)
on conflict (profile_id) do nothing;

-- ---------------------------------------------------------------------------
-- buyer preferences, swipes and a live conversation
-- ---------------------------------------------------------------------------

insert into public.buyer_profiles
  (profile_id, categories, stages, budget_min_cents, budget_max_cents, locations)
values
  ('bbbbbbbb-0000-4000-8000-000000000001',
   array['food_beverage', 'hospitality_travel'], array['established', 'scaling'],
   10000000, 80000000, array['Austin'])
on conflict (profile_id) do nothing;

-- An interest, which raises a match through the swipe trigger.
insert into public.swipes (buyer_id, listing_id, direction)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'interested'),
  -- A pass, so the "undo a pass" screen has something in it.
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000002', 'pass')
on conflict (buyer_id, listing_id) do nothing;

-- Accept it, which creates the conversation. Done with a direct write rather
-- than respond_to_match() because the seed runs as the service role and that
-- function checks auth.uid() against the listing owner.
update public.matches
   set status = 'accepted', responded_at = now()
 where buyer_id = 'bbbbbbbb-0000-4000-8000-000000000001'
   and listing_id = '11111111-0000-4000-8000-000000000001';

insert into public.conversations (id, match_id, buyer_id, seller_id, listing_id)
select
  '66666666-0000-4000-8000-000000000001', m.id, m.buyer_id,
  '55555555-0000-4000-8000-000000000001', m.listing_id
from public.matches m
where m.buyer_id = 'bbbbbbbb-0000-4000-8000-000000000001'
  and m.listing_id = '11111111-0000-4000-8000-000000000001'
on conflict (match_id) do nothing;

insert into public.messages (conversation_id, sender_id, body)
values
  ('66666666-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Thanks for accepting. Could you share the last three years of accounts?'),
  ('66666666-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000001',
   'Happy to. Are you free on Thursday?')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- advertising
-- ---------------------------------------------------------------------------

insert into public.advertisers (profile_id, company_name, blurb, website, listed)
values
  ('dddddddd-0000-4000-8000-000000000001', 'Ledger & Co',
   'Bookkeeping and year-end accounts for owner-operators.',
   'https://ledger.example', true)
on conflict (profile_id) do nothing;

insert into public.ad_campaigns
  (id, advertiser_id, placement, headline, body, destination_url,
   starts_on, ends_on, budget_cents, status, approved_by, approved_at)
values
  ('77777777-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   'discovery_feed', 'Books in order before you sell',
   'Three years of clean accounts is worth more than any listing photo.',
   'https://ledger.example/sellers',
   current_date - 7, current_date + 60, 50000, 'active',
   'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '8 days'),

  -- Waiting on review, so the admin queue is not empty.
  ('77777777-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000001',
   'dashboard', 'Month-end in an afternoon',
   'Fixed fee, no engagement letter, cancel whenever.',
   'https://ledger.example/monthly',
   current_date, current_date + 30, 25000, 'pending', null, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------------

insert into public.referral_codes (id, profile_id, code)
values
  ('88888888-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'SMALLPR1'),
  ('88888888-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002', 'CORNER22')
on conflict (id) do nothing;

-- One of each status, so the earnings summary has something to summarise.
insert into public.referrals
  (code_id, referrer_id, referred_id, status, fee_cents, qualified_at, paid_at)
values
  ('88888888-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001',
   '55555555-0000-4000-8000-000000000001', 'paid', 2500,
   now() - interval '25 days', now() - interval '10 days'),
  ('88888888-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001',
   '55555555-0000-4000-8000-000000000002', 'qualified', 2500,
   now() - interval '4 days', null)
on conflict (referred_id) do nothing;

-- ---------------------------------------------------------------------------
-- a report waiting in the queue
-- ---------------------------------------------------------------------------

insert into public.reports (reporter_id, subject_listing_id, reason, detail)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000005',
   'misleading', 'Promises a guaranteed return. This should not be here.')
on conflict do nothing;
