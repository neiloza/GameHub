-- Development seed.
--
-- Enough of every role to walk the whole product, and enough of the awkward
-- states — an unapproved seller, a suspended listing, a sold-out item, a
-- past_due membership, a promoter who has signed the agreement but has no
-- payment confirmed — that the screens which handle them can actually be seen.
--
-- Every password is `password123`. Never run this against anything real.
--
-- Fixture ids are fixed and readable so the RLS tests can reference them by
-- name rather than looking them up: `a` for admin, `s` for seller, `b` for
-- buyer, `d` for advertiser, `c` for promoter.

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

insert into auth.users (id, email)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.dev'),
  ('55555555-0000-4000-8000-000000000001', 'seller1@example.dev'),
  ('55555555-0000-4000-8000-000000000002', 'seller2@example.dev'),
  ('55555555-0000-4000-8000-000000000003', 'applicant@example.dev'),
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
  ('aaaaaaaa-0000-4000-8000-000000000001', 'buyer', 'Ada (admin)', 'Remote',
   'Runs the console.', true, true),

  -- `both`, which is what every approved seller becomes: they could already buy.
  ('55555555-0000-4000-8000-000000000001', 'both', 'Walnut & Brass', 'Portland, OR',
   'Hand-turned lamps and small furniture.', true, false),
  ('55555555-0000-4000-8000-000000000002', 'both', 'Harbour Salvage', 'Portland, ME',
   'Reclaimed marine hardware.', false, false),
  -- Applied to sell, not yet approved: still just a buyer, and the shop tooling
  -- is closed to them. The screen that says "under review" is worth seeing.
  ('55555555-0000-4000-8000-000000000003', 'buyer', 'Okonkwo Ceramics', 'Chicago, IL',
   'Waiting on review.', false, false),

  ('bbbbbbbb-0000-4000-8000-000000000001', 'buyer', 'Sam Rivera', 'Austin, TX',
   'Furnishing a first flat.', true, false),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'buyer', 'Noor Haddad', 'Chicago, IL',
   null, false, false),

  ('dddddddd-0000-4000-8000-000000000001', 'advertiser', 'Ledger & Co', 'Remote',
   'Bookkeeping for small operators.', false, false),

  ('cccccccc-0000-4000-8000-000000000001', 'promoter', 'The Small Print', 'Remote',
   'Newsletter about buying well.', false, false),
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
-- the catalogue
-- ---------------------------------------------------------------------------

insert into public.listings
  (id, owner_id, name, tagline, category, condition, location, summary,
   price_cents, stock_quantity, status)
values
  ('11111111-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000001',
   'Walnut desk lamp', 'Hand-turned, brass fittings, cloth flex',
   'home_garden', 'made_to_order', 'Portland, OR',
   'Turned from a single piece of black walnut. Each one differs a little.',
   18900, null, 'published'),

  ('11111111-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000001',
   'Brass picture light', 'Small, warm, and it clips on',
   'home_garden', 'new', 'Portland, OR',
   'Unlacquered brass, so it will patina. Ships in two days.',
   6400, 12, 'published'),

  -- Tracked and gone. Different from "not tracked", and the page says so.
  ('11111111-0000-4000-8000-000000000003', '55555555-0000-4000-8000-000000000001',
   'Oak side table', 'The last of the batch',
   'home_garden', 'new', 'Portland, OR',
   'Sold out for now — another run is planned.',
   24000, 0, 'published'),

  -- A draft: nobody but its owner and an administrator can see this row, which
  -- is the one thing worth testing about drafts.
  ('11111111-0000-4000-8000-000000000004', '55555555-0000-4000-8000-000000000001',
   'Reading lamp (draft)', 'Not photographed yet',
   'home_garden', 'made_to_order', 'Portland, OR',
   'Still deciding on the shade.',
   15000, null, 'draft'),

  ('11111111-0000-4000-8000-000000000005', '55555555-0000-4000-8000-000000000002',
   'Ship''s brass porthole', 'Refurbished, glazed, ready to hang',
   'home_garden', 'refurbished', 'Portland, ME',
   'Off a 1960s coaster. Stripped, polished and reglazed.',
   42000, 3, 'published'),

  ('11111111-0000-4000-8000-000000000006', '55555555-0000-4000-8000-000000000002',
   'Cleat set, galvanised', 'Used, sound, four of them',
   'automotive', 'used', 'Portland, ME',
   'Plenty of life left. Sold as a set.',
   5500, 8, 'published'),

  -- Suspended by an administrator. Its owner cannot republish it — the trigger
  -- refuses — which is the point of having the state at all.
  ('11111111-0000-4000-8000-000000000007', '55555555-0000-4000-8000-000000000002',
   'Genuine moon rock', 'Absolutely real, no questions',
   'other', 'used', 'Nowhere',
   'Reported and suspended.',
   100, 1, 'suspended')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------

insert into public.seller_applications
  (id, profile_id, contact_name, contact_email, motivation, shop_name, seller_type,
   categories, fulfilment_note, status, reviewed_by, reviewed_at)
values
  ('22222222-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000001',
   'Kit Marlow', 'kit@walnutandbrass.example',
   'I make lamps and small furniture, about twenty pieces a month.',
   'Walnut & Brass', 'artist', array['home_garden'],
   'Made to order, two to three weeks, shipped from my workshop.',
   'approved', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '60 days'),

  ('22222222-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000002',
   'Jo Harbour', 'jo@harboursalvage.example',
   'Reclaimed marine hardware, refurbished in house.',
   'Harbour Salvage', 'business', array['home_garden', 'automotive'],
   'Stock on hand, ships within a week.',
   'approved', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '40 days'),

  -- In the queue. The admin review screen is empty without this.
  ('22222222-0000-4000-8000-000000000003', '55555555-0000-4000-8000-000000000003',
   'Ada Okonkwo', 'ada@okonkwo.example',
   'Wheel-thrown stoneware, a few pieces a week.',
   'Okonkwo Ceramics', 'artist', array['home_garden'],
   'Made to order, fired in batches.',
   'pending', null, null)
on conflict (id) do nothing;

insert into public.advertiser_applications
  (id, profile_id, contact_name, contact_email, motivation, company_name, website,
   placements, status, reviewed_by, reviewed_at)
values
  ('33333333-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   'Jo Ledger', 'jo@ledger.example', 'Our customers are exactly your sellers.',
   'Ledger & Co', 'https://ledger.example', array['catalogue', 'dashboard'],
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
  -- Signed, not yet paid-setup: `active` is generated false. This is the state
  -- the promoter portal's "two steps to go" screen exists for.
  ('cccccccc-0000-4000-8000-000000000002', now() - interval '5 days', null)
on conflict (profile_id) do nothing;

-- ---------------------------------------------------------------------------
-- an enquiry, and a reply
-- ---------------------------------------------------------------------------

-- Written directly rather than through start_enquiry(), which reads auth.uid()
-- — null here, since the seed runs as the service role. The BEFORE trigger
-- still fills in seller_id from the listing, so the placeholder below is
-- overwritten exactly as it is for a real shopper.
insert into public.conversations (id, listing_id, buyer_id, seller_id)
values
  ('66666666-0000-4000-8000-000000000001',
   '11111111-0000-4000-8000-000000000001',
   'bbbbbbbb-0000-4000-8000-000000000001',
   'bbbbbbbb-0000-4000-8000-000000000001')
on conflict (listing_id, buyer_id) do nothing;

insert into public.messages (conversation_id, sender_id, body)
values
  ('66666666-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Is the walnut one available in a shorter stem? Ceiling is low.'),
  ('66666666-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000001',
   'It is — I can take 6cm off. Same price.')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- advertising
-- ---------------------------------------------------------------------------

insert into public.advertisers (profile_id, company_name, blurb, website, listed)
values
  ('dddddddd-0000-4000-8000-000000000001', 'Ledger & Co',
   'Bookkeeping and year-end accounts for people who sell things.',
   'https://ledger.example', true)
on conflict (profile_id) do nothing;

insert into public.ad_campaigns
  (id, advertiser_id, placement, headline, body, destination_url,
   starts_on, ends_on, budget_cents, status, approved_by, approved_at)
values
  ('77777777-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   'catalogue', 'Books in order before tax season',
   'Fixed fee, no engagement letter, cancel whenever.',
   'https://ledger.example/sellers',
   current_date - 7, current_date + 60, 50000, 'active',
   'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '8 days'),

  -- Waiting on review, so the admin queue is not empty.
  ('77777777-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000001',
   'dashboard', 'Month-end in an afternoon',
   'We do the boring half.',
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
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000007',
   'misleading', 'This is not a moon rock.')
on conflict do nothing;
