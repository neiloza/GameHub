-- RLS: the catalogue, buyer-initiated enquiries, advertising and referrals.
-- Run with: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
set local search_path to public, extensions;
select plan(28);

create or replace function pg_temp.impersonate(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated')::text,
    true
  );
end;
$$;

create or replace function pg_temp.impersonate_anon()
returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end;
$$;

\set admin      'aaaaaaaa-0000-4000-8000-000000000001'
\set seller1    '55555555-0000-4000-8000-000000000001'
\set seller2    '55555555-0000-4000-8000-000000000002'
\set buyer1     'bbbbbbbb-0000-4000-8000-000000000001'
\set buyer2     'bbbbbbbb-0000-4000-8000-000000000002'
\set advertiser 'dddddddd-0000-4000-8000-000000000001'
\set promoter1  'cccccccc-0000-4000-8000-000000000001'
\set promoter2  'cccccccc-0000-4000-8000-000000000002'

\set lamp       '11111111-0000-4000-8000-000000000001'
\set porthole   '11111111-0000-4000-8000-000000000005'
\set draft      '11111111-0000-4000-8000-000000000004'
\set suspended  '11111111-0000-4000-8000-000000000007'

-- ---------------------------------------------------------------------------
-- the catalogue is public
-- ---------------------------------------------------------------------------

select pg_temp.impersonate_anon();

select ok(
  (select count(*) from public.search_catalogue()) >= 5,
  'a signed-out visitor can browse the whole catalogue'
);

select is(
  (select count(*)::int from public.search_catalogue()
    where id in (:'draft'::uuid, :'suspended'::uuid)),
  0,
  'and sees neither a draft nor a suspended listing'
);

select is(
  (select count(*)::int from public.listing_seller(:'lamp'::uuid)),
  1,
  'and can see who is selling, on a public product page'
);

select is(
  (select count(*)::int from public.listing_seller(:'draft'::uuid)),
  0,
  'but not who is behind an unpublished one'
);

-- ---------------------------------------------------------------------------
-- search and filters
-- ---------------------------------------------------------------------------

select ok(
  (select count(*) from public.search_catalogue('walnut')) >= 1,
  'full-text search finds a listing by a word in its name'
);

select is(
  (select count(*)::int from public.search_catalogue('walnut')
    where name not ilike '%walnut%' and coalesce(summary, '') not ilike '%walnut%'),
  0,
  'and returns nothing that does not contain it'
);

-- An apostrophe or a stray quote must not raise: plainto_tsquery treats the
-- input as words, which is the whole reason it is used instead of to_tsquery.
select lives_ok(
  $$ select * from public.search_catalogue('ship''s "brass') $$,
  'a search box survives punctuation somebody actually types'
);

select is(
  (select count(*)::int from public.search_catalogue(p_condition := 'used')
    where condition <> 'used'),
  0,
  'the condition filter filters'
);

select is(
  (select count(*)::int from public.search_catalogue(p_max_cents := 7000)
    where price_cents > 7000),
  0,
  'and so does a price ceiling'
);

select ok(
  (select array_agg(price_cents order by ordinality)
     from public.search_catalogue(p_sort := 'price_asc') with ordinality)
  = (select array_agg(price_cents order by price_cents, created_at desc)
       from public.listings where status = 'published'),
  'price_asc really is ascending'
);

select is(
  public.count_catalogue(),
  (select count(*) from public.listings where status = 'published'),
  'the pager count agrees with the catalogue'
);

-- ---------------------------------------------------------------------------
-- the buyer starts the conversation, and only the buyer
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'buyer2'::uuid);

select isnt(
  public.start_enquiry(:'porthole'::uuid, 'Is the glass original?'),
  null,
  'any signed-in member can ask a seller about a published listing'
);

select is(
  (select count(*)::int from public.conversations),
  1,
  'which gives them exactly one thread'
);

-- The seller_id is filled from the listing, not from what the client claimed.
select is(
  (select seller_id from public.conversations limit 1),
  :'seller2'::uuid,
  'and the seller on it is the one who owns the listing'
);

select throws_ok(
  $$ insert into public.conversations (listing_id, buyer_id, seller_id)
     values ('11111111-0000-4000-8000-000000000004',
             'bbbbbbbb-0000-4000-8000-000000000002',
             '55555555-0000-4000-8000-000000000001') $$,
  'that listing is not on sale',
  'nobody can open a thread about a listing that is not published'
);

-- The asymmetry, stated directly: a seller cannot name themselves the buyer on
-- somebody else's behalf, and cannot name somebody else as the buyer at all.
reset role;
select pg_temp.impersonate(:'seller1'::uuid);

select throws_ok(
  $$ insert into public.conversations (listing_id, buyer_id, seller_id)
     values ('11111111-0000-4000-8000-000000000005',
             'bbbbbbbb-0000-4000-8000-000000000001',
             '55555555-0000-4000-8000-000000000001') $$,
  '42501',
  null,
  'a seller cannot open a conversation with a shopper'
);

select is(
  (select count(*)::int from public.conversations),
  1,
  'a seller sees the enquiries on their own listings and nothing else'
);

-- Capture the thread id as superuser: buyer1 is a stranger to it, so under
-- their own RLS the id is not something they could select for themselves —
-- which is the point, and would make a sub-select insert nothing and raise
-- nothing rather than being refused.
reset role;
select id as thread from public.conversations
 where buyer_id = 'bbbbbbbb-0000-4000-8000-000000000002' \gset

select pg_temp.impersonate(:'buyer1'::uuid);

select throws_ok(
  format(
    $$ insert into public.messages (conversation_id, sender_id, body)
       values (%L, 'bbbbbbbb-0000-4000-8000-000000000001', 'hello') $$,
    :'thread'
  ),
  '42501',
  null,
  'and a stranger cannot post into a thread they are not part of, even knowing its id'
);

-- ---------------------------------------------------------------------------
-- advertising
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'seller1'::uuid);

select is(
  (select count(*)::int from public.ad_campaigns),
  1,
  'a member sees live campaigns and nothing else (the pending one is hidden)'
);

reset role;
select pg_temp.impersonate(:'advertiser'::uuid);

select throws_ok(
  $$ update public.ad_campaigns
        set approved_at = now(), approved_by = 'dddddddd-0000-4000-8000-000000000001'
      where id = '77777777-0000-4000-8000-000000000002' $$,
  'not allowed to approve your own campaign',
  'an advertiser cannot approve their own campaign'
);

select throws_ok(
  $$ update public.advertisers set listed = false
      where profile_id = 'dddddddd-0000-4000-8000-000000000001' $$,
  'not allowed to change your own directory listing',
  'an advertiser cannot change their own directory listing'
);

-- The catalogue is public, so an advertiser browses it like anybody else. What
-- they must never reach is an unpublished listing or a conversation.
select is(
  (select count(*)::int from public.listings where status <> 'published'),
  0,
  'an advertiser sees no draft and no suspended listing'
);

select is(
  (select count(*)::int from public.conversations),
  0,
  'and no conversation'
);

-- ---------------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'promoter1'::uuid);

select is(
  (select count(*)::int from public.referrals),
  2,
  'a promoter sees their own referrals'
);

reset role;
select pg_temp.impersonate(:'promoter2'::uuid);

select is(
  (select count(*)::int from public.referrals),
  0,
  'and none of anybody else''s'
);

select throws_ok(
  $$ select public.mark_referrals_paid(array[]::uuid[]) $$,
  'only an administrator may settle a payout',
  'a promoter cannot settle their own payout'
);

-- Attribution is first-write-wins and never moves.
reset role;
select pg_temp.impersonate(:'seller1'::uuid);

select is(
  public.attribute_signup('CORNER22'),
  false,
  'a second code on an already-attributed account is refused'
);

reset role;
select pg_temp.impersonate(:'promoter1'::uuid);

select is(
  public.attribute_signup('SMALLPR1'),
  false,
  'and nobody can refer themselves'
);

select * from finish();
rollback;
