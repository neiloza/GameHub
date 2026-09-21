-- RLS: profiles, the role guard, listings and their visibility.
-- Run with: supabase test db   (requires `supabase start` and the seed)

begin;
create extension if not exists pgtap with schema extensions;
set local search_path to public, extensions;
select plan(22);

-- Impersonate a member for the rest of this transaction. Sets both the role
-- (so RLS applies at all — the postgres superuser bypasses it) and the claim
-- auth.uid() reads.
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

\set applicant         '55555555-0000-4000-8000-000000000003'
\set draft_listing     '11111111-0000-4000-8000-000000000004'
\set suspended_listing '11111111-0000-4000-8000-000000000007'

-- ---------------------------------------------------------------------------
-- listing visibility
-- ---------------------------------------------------------------------------

select pg_temp.impersonate_anon();

select ok(
  (select count(*) from public.listings where status = 'published') >= 3,
  'a signed-out visitor reads published listings'
);

select is(
  (select count(*)::int from public.listings where id = :'draft_listing'::uuid),
  0,
  'a signed-out visitor cannot see a draft'
);

select is(
  (select count(*)::int from public.listings where id = :'suspended_listing'::uuid),
  0,
  'a signed-out visitor cannot see a suspended listing'
);

reset role;
select pg_temp.impersonate(:'seller1'::uuid);

select is(
  (select count(*)::int from public.listings where id = :'draft_listing'::uuid),
  1,
  'an owner sees their own draft'
);

reset role;
select pg_temp.impersonate(:'buyer1'::uuid);

select is(
  (select count(*)::int from public.listings where id = :'draft_listing'::uuid),
  0,
  'another member cannot see somebody else''s draft'
);

reset role;
select pg_temp.impersonate(:'admin'::uuid);

select is(
  (select count(*)::int from public.listings where id = :'draft_listing'::uuid),
  1,
  'an administrator sees every listing'
);

-- ---------------------------------------------------------------------------
-- the role guard — the single most important thing in this schema
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'seller1'::uuid);

select throws_ok(
  $$ update public.profiles set role = 'seller' where id = '55555555-0000-4000-8000-000000000001' $$,
  'not allowed to change your own role',
  'a member cannot grant themselves another role'
);

select throws_ok(
  $$ update public.profiles set is_admin = true where id = '55555555-0000-4000-8000-000000000001' $$,
  'not allowed to change privileged profile columns',
  'a member cannot make themselves an administrator'
);

-- seller2 is the unverified fixture: the guard compares old to new, so asking
-- an already-verified account to set verified = true changes nothing and
-- correctly raises nothing.
reset role;
select pg_temp.impersonate(:'seller2'::uuid);

select throws_ok(
  $$ update public.profiles set verified = true where id = '55555555-0000-4000-8000-000000000002' $$,
  'not allowed to change privileged profile columns',
  'a member cannot mark themselves verified'
);

reset role;
select pg_temp.impersonate(:'seller1'::uuid);

-- Updating somebody else's profile is refused by RLS rather than by the
-- trigger, so it silently affects no rows instead of raising.
select lives_ok(
  $$ update public.profiles set display_name = 'Hijacked'
      where id = '55555555-0000-4000-8000-000000000002' $$,
  'updating another profile is permitted by the parser'
);

select is(
  (select display_name from public.profiles where id = :'seller2'::uuid),
  'Harbour Salvage',
  '...but RLS matched no row, so nothing changed'
);

-- ---------------------------------------------------------------------------
-- suspension
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'seller2'::uuid);

-- Two different mechanisms, worth keeping apart. Republishing is refused by
-- RLS: the owner UPDATE policy excludes suspended rows, so the statement
-- matches nothing and raises nothing. Suspending is refused by the trigger,
-- because the row *is* one the policy lets through.
select lives_ok(
  $$ update public.listings set status = 'published'
      where id = '11111111-0000-4000-8000-000000000007' $$,
  'republishing a suspended listing raises nothing...'
);

select is(
  (select count(*)::int from public.listings
    where id = '11111111-0000-4000-8000-000000000007'::uuid and status = 'published'),
  0,
  '...because RLS matched no row, so it is still suspended'
);

select throws_ok(
  $$ update public.listings set status = 'suspended'
      where id = '11111111-0000-4000-8000-000000000005' $$,
  'not allowed to change suspension status',
  'an owner cannot suspend a listing either'
);

-- ---------------------------------------------------------------------------
-- application review
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'applicant'::uuid);

select throws_ok(
  $$ update public.seller_applications set status = 'approved'
      where id = '22222222-0000-4000-8000-000000000003' $$,
  'not allowed to review your own application',
  'an applicant cannot approve their own application'
);

select throws_ok(
  $$ select public.review_application(
       'seller', '22222222-0000-4000-8000-000000000003', 'approved', null) $$,
  'only an administrator may review an application',
  'a member cannot call the review function'
);

select is(
  (select count(*)::int from public.seller_applications),
  1,
  'an applicant sees only their own application'
);

-- The inversion, stated as a test: an application that has not been approved
-- buys nothing.
--
-- Two mechanisms would refuse this — the INSERT policy's is_seller(), and the
-- listing-limit trigger — and the trigger wins, because a BEFORE trigger runs
-- before RLS evaluates WITH CHECK. That ordering is why the trigger checks the
-- role itself: otherwise the message names the membership rather than the
-- actual reason.
select throws_ok(
  $$ insert into public.listings (owner_id, name, category, price_cents)
     values ('55555555-0000-4000-8000-000000000003', 'Jumping the queue',
             'home_garden', 1000) $$,
  'an approved seller application is needed before you can list anything',
  'somebody whose seller application is still pending cannot list anything'
);

-- ---------------------------------------------------------------------------
-- reviewer notes are never visible to the applicant
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'admin'::uuid);

insert into public.application_notes (application_kind, application_id, author_id, body)
values ('seller', '22222222-0000-4000-8000-000000000003',
        'aaaaaaaa-0000-4000-8000-000000000001', 'Needs a reference. Do not approve yet.');

select is(
  (select count(*)::int from public.application_notes),
  1,
  'an administrator reads the reviewer notes'
);

reset role;
select pg_temp.impersonate(:'applicant'::uuid);

select is(
  (select count(*)::int from public.application_notes),
  0,
  'the applicant the note is about cannot read it'
);

-- ---------------------------------------------------------------------------
-- role isolation
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'promoter1'::uuid);

select is(
  (select count(*)::int from public.conversations),
  0,
  'a promoter reaches no conversation they are not part of'
);

-- Anybody can shop, promoter included — that is the whole point of buyer being
-- the default. What they cannot do is sell.
select ok(
  (select count(*) from public.search_catalogue()) > 0,
  'and can still browse the shop like anybody else'
);

select * from finish();
rollback;
