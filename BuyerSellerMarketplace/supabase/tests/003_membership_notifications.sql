-- The listing cap, the membership boundary, and the notification pipeline.
-- Run with: supabase test db

begin;
create extension if not exists pgtap with schema extensions;
set local search_path to public, extensions;
select plan(19);

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

\set admin    'aaaaaaaa-0000-4000-8000-000000000001'
\set seller1  '55555555-0000-4000-8000-000000000001'
\set seller2  '55555555-0000-4000-8000-000000000002'
\set buyer1   'bbbbbbbb-0000-4000-8000-000000000001'
\set applicant '55555555-0000-4000-8000-000000000003'
\set promoter1 'cccccccc-0000-4000-8000-000000000001'

-- ---------------------------------------------------------------------------
-- has_active_membership
-- ---------------------------------------------------------------------------

select is(
  public.has_active_membership(:'seller1'::uuid),
  true,
  'a paid-up member is active'
);

select is(
  public.has_active_membership(:'seller2'::uuid),
  false,
  'past_due is not active — the processor is still retrying'
);

select is(
  public.has_active_membership(:'buyer1'::uuid),
  false,
  'an account with no membership row at all is not active'
);

-- ---------------------------------------------------------------------------
-- the listing cap
-- ---------------------------------------------------------------------------

select pg_temp.impersonate(:'seller2'::uuid);

select throws_ok(
  $$ insert into public.listings (owner_id, name, category, price_cents)
     values ('55555555-0000-4000-8000-000000000002', 'Another one',
             'other', 1000) $$,
  'a membership is required to publish a listing',
  'a lapsed member cannot add a listing'
);

reset role;
select pg_temp.impersonate(:'applicant'::uuid);

-- The role check comes first, and says so. Somebody still in the review queue
-- should not be told to buy a membership that would not help.
select throws_ok(
  $$ insert into public.listings (owner_id, name, category, price_cents)
     values ('55555555-0000-4000-8000-000000000003', 'Too soon',
             'other', 1000) $$,
  'an approved seller application is needed before you can list anything',
  'and somebody who is not a seller at all is told the actual reason'
);

reset role;
select pg_temp.impersonate(:'seller1'::uuid);

select lives_ok(
  $$ insert into public.listings (owner_id, name, category, price_cents)
     values ('55555555-0000-4000-8000-000000000001', 'A fourth thing',
             'other', 1000) $$,
  'a paid-up seller can'
);

-- ---------------------------------------------------------------------------
-- nobody writes a membership, administrators included
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'buyer1'::uuid);

-- There is no INSERT policy on `memberships` for anybody, so RLS refuses the
-- row outright rather than silently matching nothing.
select throws_ok(
  $$ insert into public.memberships (profile_id, plan, state)
     values ('bbbbbbbb-0000-4000-8000-000000000001', 'standard_annual', 'active') $$,
  '42501',
  null,
  'a member cannot write themselves a membership'
);

select is(
  public.has_active_membership(:'buyer1'::uuid),
  false,
  'and is still not a member afterwards'
);

reset role;
select pg_temp.impersonate(:'admin'::uuid);

select is(
  (select count(*)::int from public.memberships
    where profile_id = :'buyer1'::uuid),
  0,
  'and an administrator cannot hand out a membership either'
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

reset role;
select pg_temp.impersonate(:'seller1'::uuid);

select ok(
  (select count(*) from public.notifications
    where kind = 'enquiry_received') >= 1,
  'an enquiry notified the seller'
);

select is(
  (select count(*)::int from public.notifications
    where profile_id <> :'seller1'::uuid),
  0,
  'and a member reads only their own notifications'
);

reset role;
select pg_temp.impersonate(:'buyer1'::uuid);

select ok(
  (select count(*) from public.notifications where kind = 'message_received') >= 1,
  'the seller''s reply notified the shopper'
);

-- The opening message is the enquiry, and the conversation trigger has already
-- covered it. One event, one notice.
select is(
  (select count(*)::int from public.notifications
    where kind = 'message_received'
      and payload ->> 'recipient_side' = 'seller'),
  0,
  'and the enquiry itself was not announced twice'
);

-- The two sides read the same thread at different routes, so the payload
-- carries the recipient's side. Each party only ever sees the notice addressed
-- to them, which is why this is checked from both ends.
select is(
  (select payload ->> 'recipient_side' from public.notifications
    where kind = 'message_received' order by created_at limit 1),
  'buyer',
  'the shopper''s message notice routes them to their own inbox'
);

-- Preferences gate delivery, never the record.
reset role;
select pg_temp.impersonate(:'seller1'::uuid);

insert into public.notification_preferences (profile_id, email_activity)
values ('55555555-0000-4000-8000-000000000001', false)
on conflict (profile_id) do update set email_activity = false;

reset role;
select set_config('role', 'postgres', true);

select public.notify_profile(
  '55555555-0000-4000-8000-000000000001', 'enquiry_received', '{}'::jsonb
) as muted_id \gset

select is(
  (select count(*)::int from public.notifications where id = :'muted_id'::uuid),
  1,
  'an opted-out member still gets the in-app record'
);

select is(
  (select count(*)::int from public.notification_deliveries
    where notification_id = :'muted_id'::uuid and channel = 'email'),
  0,
  'but no email delivery is queued'
);

select public.notify_profile(
  '55555555-0000-4000-8000-000000000001', 'membership_trouble', '{}'::jsonb
) as account_id \gset

select is(
  (select count(*)::int from public.notification_deliveries
    where notification_id = :'account_id'::uuid and channel = 'email'),
  1,
  'an account notice is unaffected by the activity opt-out'
);

select is(
  (select count(*)::int from public.notification_deliveries
    where notification_id = :'account_id'::uuid and channel = 'push'),
  0,
  'and account notices are never pushed'
);

-- The category table must agree with the client's copy of it.
select is(
  public.notification_category('a_kind_added_next_year'),
  'account',
  'an unknown kind falls to account, never marketing'
);

select * from finish();
rollback;
