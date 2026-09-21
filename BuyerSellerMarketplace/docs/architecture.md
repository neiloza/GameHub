# How this fits together

Four layers, and one rule about where decisions live.

```
apps/web            React. Renders, collects input, routes.
packages/shared     The rules that can be tested without a database.
supabase/migrations The rules that must hold whatever the client does.
supabase/functions  The things that talk to somebody else's API.
```

## The rule

**A decision lives in exactly one layer, and the lowest one that can make it.**

Anything a hostile client could skip belongs in the database. Anything that is
presentation — which link to show, which page to land on, what to call a status —
belongs in `packages/shared`, where it can be unit-tested. Nothing important is
decided in a component.

That is why, for example:

- `canAccessPath()` in the shared package decides what a role *sees*, and RLS
  decides what a role *gets*. If the two disagree, the member sees an empty
  screen — annoying, not a breach.
- `search_catalogue()` runs as the *caller*, not security definer, so RLS
  decides what comes back rather than the function re-deriving it. A seller
  searching their own shop finds their own draft, and nothing else changes.
- `lib/membership.ts` says what a membership includes, and one gate —
  `enforce_listing_limit` — is also in the database, because it is the only one
  a client could otherwise bypass by writing straight to the table.

## The two guard patterns

RLS decides which *rows* a caller can touch. It has nothing to say about
*columns*, and that gap is where privilege escalation lives. Two patterns close
it:

**A BEFORE trigger**, for a column inside a row the caller legitimately owns.
`protect_profile_privileged_columns()` is the important one: the owner UPDATE
policy permits the whole row, so without the trigger a member could PATCH
`role` to `seller` and open four policies at once. The trigger short-circuits
for the service role (`auth.uid() is null`) and for administrators, which is how
`review_application()` is allowed past it and nothing else is.

`set_conversation_seller()` is the same pattern used for a different purpose: the
buyer supplies both ids when opening an enquiry, and nothing an INSERT policy can
express would check that the account they named as the seller actually owns the
listing. So the column is overwritten from the listing rather than trusted —
without it, a shopper could name any account as "the seller" and message a
stranger through a conversation they were entitled to create.

**A column grant**, for a column the caller may read rows of but should not see.
`ad_events.viewer_id` is revoked from `authenticated` and re-granted per column,
so an advertiser reading their own campaign's events cannot reconstruct who saw
their ad.

## Where a write actually happens

| Written by | Examples |
|---|---|
| The member, under RLS | Their profile, their listings, their messages, their enquiries |
| A security-definer function | Role changes, application decisions, opening an enquiry, referral payouts |
| A trigger | `conversations.seller_id` (from the listing), notifications, audit rows |
| The service role only | Memberships, billing events, identity outcomes |

`memberships` has no INSERT or UPDATE policy for anybody, administrators
included. An administrator who could hand out a membership would be creating a
paid account the payment processor has never heard of, and the next webhook
would silently undo it.

## Idempotency

Two places assume they will be called twice, because they will be:

- **`billing_events.event_id`** is unique, and the webhook inserts before it acts.
  A conflict means "already seen" and returns 200 — anything else asks the
  processor to retry a delivery that already succeeded.
- **`claim_notification_delivery()`** uses `for update skip locked`, so two
  dispatch workers claim disjoint batches rather than racing for the same row.

## Adding a feature

1. Migration first: tables, CHECK constraints, RLS policies, and a trigger for
   any column that must not be self-written.
2. A pgTAP test that proves the policy refuses what it should.
3. Types in `packages/shared/src/types/database.ts`; a zod schema mirroring the
   CHECKs; functions in `api/`.
4. Pure logic in `lib/`, with a test.
5. The screen, last, holding as little decision-making as you can manage.
