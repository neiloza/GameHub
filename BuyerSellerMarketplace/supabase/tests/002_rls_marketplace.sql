-- RLS: the discovery feed, mutual-consent chat, advertising and referrals.
-- Run with: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
set local search_path to public, extensions;
select plan(26);

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

\set admin      'aaaaaaaa-0000-4000-8000-000000000001'
\set seller1    '55555555-0000-4000-8000-000000000001'
\set seller2    '55555555-0000-4000-8000-000000000002'
\set buyer1     'bbbbbbbb-0000-4000-8000-000000000001'
\set buyer2     'bbbbbbbb-0000-4000-8000-000000000002'
\set advertiser 'dddddddd-0000-4000-8000-000000000001'
\set promoter1  'cccccccc-0000-4000-8000-000000000001'
\set promoter2  'cccccccc-0000-4000-8000-000000000002'

\set conversation '66666666-0000-4000-8000-000000000001'
\set live_campaign '77777777-0000-4000-8000-000000000001'
\set harbour '11111111-0000-4000-8000-000000000004'

-- ---------------------------------------------------------------------------
-- the approval gate on the feed
-- ---------------------------------------------------------------------------

select pg_temp.impersonate(:'buyer2'::uuid);

select is(
  (select count(*)::int from public.get_discovery_feed()),
  0,
  'a buyer whose application is still pending gets an empty feed'
);

reset role;
select pg_temp.impersonate(:'buyer1'::uuid);

select ok(
  (select count(*) from public.get_discovery_feed()) > 0,
  'an approved buyer gets a feed'
);

select is(
  (select count(*)::int from public.get_discovery_feed()
    where id = '11111111-0000-4000-8000-000000000001'::uuid),
  0,
  'a listing already swiped has left the feed'
);

select is(
  (select count(*)::int from public.get_discovery_feed() where status <> 'published'),
  0,
  'the feed never contains a draft or a suspended listing'
);

select is(
  (select count(*)::int from public.get_skipped_feed()),
  1,
  'a pass is recoverable from the skipped feed'
);

-- ---------------------------------------------------------------------------
-- mutual consent
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.conversations),
  1,
  'the buyer sees the one conversation their accepted match created'
);

select is(
  (select count(*)::int from public.messages),
  2,
  'and reads its messages'
);

reset role;
select pg_temp.impersonate(:'seller2'::uuid);

select is(
  (select count(*)::int from public.conversations),
  0,
  'an unrelated seller sees no conversation'
);

select is(
  (select count(*)::int from public.messages),
  0,
  'and no messages'
);

-- The critical one: a stranger cannot start a thread with anybody.
select throws_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     values ('66666666-0000-4000-8000-000000000001',
             '55555555-0000-4000-8000-000000000002', 'hello') $$,
  '42501',
  null,
  'a stranger cannot post into a conversation they are not part of'
);

-- ---------------------------------------------------------------------------
-- the seller decides, and only the seller
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'buyer1'::uuid);

-- A fresh interest, so there is a pending match to answer.
insert into public.swipes (buyer_id, listing_id, direction)
values ('bbbbbbbb-0000-4000-8000-000000000001',
        '11111111-0000-4000-8000-000000000004', 'interested');

select is(
  (select status from public.matches
    where buyer_id = :'buyer1'::uuid and listing_id = :'harbour'::uuid),
  'pending',
  'an interest raises a pending match rather than a conversation'
);

select throws_ok(
  $$ select public.respond_to_match(
       (select id from public.matches
         where buyer_id = 'bbbbbbbb-0000-4000-8000-000000000001'
           and listing_id = '11111111-0000-4000-8000-000000000004'),
       true) $$,
  'only the listing owner may answer this',
  'a buyer cannot accept on the seller''s behalf'
);

reset role;
select pg_temp.impersonate(:'admin'::uuid);

select throws_ok(
  $$ select public.respond_to_match(
       (select id from public.matches
         where buyer_id = 'bbbbbbbb-0000-4000-8000-000000000001'
           and listing_id = '11111111-0000-4000-8000-000000000004'),
       true) $$,
  'only the listing owner may answer this',
  'not even an administrator can consent on somebody else''s behalf'
);

reset role;
select pg_temp.impersonate(:'seller2'::uuid);

select isnt(
  (select public.respond_to_match(
     (select id from public.matches
       where buyer_id = 'bbbbbbbb-0000-4000-8000-000000000001'
         and listing_id = '11111111-0000-4000-8000-000000000004'),
     true)),
  null,
  'the listing owner accepting returns a conversation id'
);

select throws_ok(
  $$ select public.respond_to_match(
       (select id from public.matches
         where buyer_id = 'bbbbbbbb-0000-4000-8000-000000000001'
           and listing_id = '11111111-0000-4000-8000-000000000004'),
       false) $$,
  'this has already been answered',
  'an answered match cannot be answered again'
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

-- Published listings are public by design — a signed-out visitor landing on
-- one from a search engine is the point — so an advertiser sees them too. What
-- they must never reach is anything a listing's owner has not published, and
-- anything two members said to each other.
select is(
  (select count(*)::int from public.listings where status <> 'published'),
  0,
  'an advertiser sees no draft and no suspended listing'
);

select is(
  (select count(*)::int from public.conversations),
  0,
  'an advertiser reaches no conversation'
);

select is(
  (select count(*)::int from public.buyer_applications),
  0,
  'and no application but their own'
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
