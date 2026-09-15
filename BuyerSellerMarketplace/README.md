# BuyerSellerMarketplace

A two-sided marketplace starter, shaped like a shop: a public catalogue with
search and filters, buyer-initiated enquiries, seller applications reviewed by a
person, advertising, a referral programme, membership billing, and a PWA — with
every rule that matters enforced in the database rather than in the client.

It maps onto anything where one side lists and the other side buys: Amazon,
Etsy, Redbubble, eBay, a classifieds site, a B2B supplier directory.

> **Provenance.** This folder was extracted from the **Aquarium** project
> (`neiloza/Aquarium`), a founder–investor introduction platform built for a
> client, and genericised into a reusable starter. The reusable parts — the role
> model, authentication, the messaging layer, the application workflow, the
> admin console, billing, notifications and the PWA shell — were kept and
> reshaped; everything specific to Aquarium was deliberately left behind (see
> [What was left out](#what-was-left-out)). Recorded here and in the GameHub
> README so the lineage is not lost.

## What it is

Two rules carry the whole design.

**Browsing is public.** The catalogue, the product pages and the search are
readable by `anon` — no account, no approval. A shop you need permission to look
at is not a shop.

**The buyer starts the conversation, never the seller.** A shopper can ask about
anything on sale; a seller can only answer. That is not a policy document, it is
an INSERT policy on `conversations` requiring `buyer_id = auth.uid()`, plus a
trigger that fills in the seller from the listing rather than trusting what the
client claimed. It is what stops the member list becoming a mailing list.

### The five parties

| Role | What they reach | How they get it |
|---|---|---|
| **buyer** | The catalogue, and threads they started | The only self-serve role — a new account is a buyer |
| **seller** | Their listings, the enquiries on them, their membership | An application, reviewed by an administrator |
| **advertiser** | Their own listing, campaigns and counts — nothing unpublished, no conversations | An application |
| **promoter** | Their referral link and earnings | An application |
| *administrator* | Everything, plus the console | `profiles.is_admin` — granted, never applied for |

`both` is a sixth value, and it is what every approved seller becomes: they could
already buy, and opening a shop should not cost them that. It is a combination,
not a party of its own.

## Structure

```
apps/web            Next.js (App Router), Tailwind, PWA
packages/shared     zod schemas, DB types, the API layer, hooks, pure logic
supabase/           migrations (source of truth), seed, pgTAP RLS tests, edge functions
```

## Getting started

Prereqs: Node 20+, pnpm 10, Docker, the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
pnpm install
supabase start                     # local Postgres/Auth/Realtime, applies migrations + seed
cp apps/web/.env.example apps/web/.env.local
# paste the anon key printed by `supabase start` into .env.local
pnpm dev:web                       # http://localhost:3000
```

Seeded accounts (see `supabase/seed.sql` for what state each one is in):

| Account | Email |
|---|---|
| Admin | `admin@example.dev` |
| Sellers | `seller1@example.dev`, `seller2@example.dev` (past_due membership) |
| Seller applicant | `applicant@example.dev` (still in the review queue) |
| Buyers | `buyer1@example.dev`, `buyer2@example.dev` |
| Advertiser | `advertiser1@example.dev` |
| Promoters | `promoter1@example.dev` (active), `promoter2@example.dev` (mid-setup) |

The seed deliberately includes the awkward states — a seller application still
pending, a suspended listing, a sold-out item, a failing payment, a half-set-up
promoter — because those are the screens that otherwise never get looked at.

## Checks

```bash
pnpm typecheck        # all workspaces
pnpm lint
pnpm test             # vitest — access rules, schemas, membership, notifications, onboarding
supabase test db      # pgTAP RLS tests (requires supabase start)
pnpm build:web
```

## What's in it

**Authentication.** Email and password, Google and Apple OAuth, and full password
recovery. One callback route handles both link shapes Supabase sends (`?code=`
and `?token_hash=`), because a recovery email that arrives in the shape the app
does not accept is a member locked out of their account. `safeRedirectPath()`
narrows the `next` parameter to a same-origin path — those links are built by
whoever can trigger one, and they are clicked from an inbox.

**Roles and access.** `lib/access.ts` is the permission matrix as data: one table
that the navigation, the middleware and the per-page guard all read, so they
cannot disagree. It is routing only — RLS is the real boundary, and the point of
gating routes is that a promoter following a stale link lands on their own
dashboard instead of an empty shell that looks broken. The catalogue is
deliberately *absent* from that table, because it is public.

**The catalogue.** Full-text search over name, tagline and summary, filters for
category and condition, sort by price or recency, and a pager. Every filter
lives in the query string, so a search is a URL that can be linked, bookmarked
and reached with the back button. `plainto_tsquery` rather than `to_tsquery`, so
an apostrophe is a character rather than a syntax error.

**Enquiries.** A shopper asks about a listing; that opens one thread, scoped to
that listing, and the seller answers in it. Realtime, with optimistic sends. One
thread per shopper per listing, so a follow-up question lands where the first
answer is. A block stops a thread from both ends without deleting the history.

**Applications.** Three tables, one workflow: submit, question, answer, decide.
`info_requested` exists so "not quite enough detail" and "no" are different
outcomes. Reviewer notes live in a separate table from the applicant-visible
thread, so their privacy is a property of the schema rather than a detail of a
policy.

**Membership and billing.** Hosted checkout and portal, and a webhook that records
every event before acting on it — a unique `event_id` is what stops a replayed
delivery paying a referral four times. No card detail ever reaches this codebase.

**Advertising.** Placement-scoped slots (catalogue, product page, dashboard,
directory), campaigns an administrator approves and the advertiser can pause
instantly, and impression/click counts recorded through a function so the viewer
id comes from the session rather than the browser. A column grant — not just RLS
— keeps `viewer_id` out of an advertiser's reach.

**Referrals.** First-write-wins attribution that never moves, a fee snapshotted at
referral time so a rate change is never retroactive, and payouts settled by a
human after money has actually moved.

**Notifications.** In-app, email and push, with preferences that gate *delivery*
and never the record. The outbox uses `for update skip locked`, so two dispatch
workers are safe to run at once.

**Admin console.** Applications, accounts, reports, advertising, promoters,
billing reconciliation, feedback, and an audit log written in the same
transaction as the change it records.

**PWA.** Manifest, maskable icon, an auto-updater that reloads on a new deploy
(but not while someone is typing), safe-area padding, and a reduced-motion
block.

## Conventions

- Schema changes only via migrations. RLS on every table, with at least one policy.
- A column that must not be self-written is guarded by a BEFORE trigger — RLS is
  row-level and cannot protect a single column.
- zod validation from `packages/shared` on every input. The database wins when
  the two disagree; the disagreement is a bug.
- Money in integer cents (`bigint`), never a float. Timestamps in UTC.
- Enums are mirrored in three places — `constants.ts`, a zod enum, a CHECK
  constraint. Adding a value means touching all three, deliberately.

## Pricing switches

The shipped model is one paid membership. `PURCHASABLE_PLANS` looks like four
plans but it is one product: monthly or annual, at an introductory rate while
places remain and the standard rate afterwards. Two things are built, tested and
switched **off**, so turning either on later is a one-line decision:

| Switch | Where | Default | What it would do |
|---|---|---|---|
| `TRIAL_ENABLED` | `packages/shared/src/constants.ts` | `false` | A free trial, built as the membership *state* `trialing` rather than as a plan, so every existing gate already honours it |
| `FREE_LISTINGS` | `packages/shared/src/constants.ts` | `0` | What an approved seller gets without paying. Zero is what "no free tier" means in practice; raising it to 1 is the whole of a basic free tier |

`NEVER_GATED_CAPABILITIES` and `membership.test.ts` make the free-forever promise
a failing build rather than a sentence on a page.

## What was left out

Everything specific to Aquarium's domain, deliberately:

- Founder–investor matching as such: startups, pitch events and competitions,
  voting and leaderboards, investor accreditation and check-size verification.
- The swipe deck and everything around it: swipes, pending matches, accept and
  decline, preference-weighted ranking, the undo-a-pass feed. A catalogue does
  not need a matchmaker, and a shopper who has to be *matched* with a thing they
  can already see is a shopper being made to do the shop's filing.
- The funding tooling: the funding directory, grant finder, government
  contracting module, eligibility engine and its state corpus.
- The founder tooling: business plan builder, business credit centre, readiness
  assessment, personalised checklist, milestones, reminders.
- The resource library and both AI assistants, along with their content seeds.
- Mux-backed pitch video.
- Aquarium's demo mode — a 9,000-line in-browser fake Supabase client with
  generated fixtures. Genuinely useful, but inseparable from that project's
  content. If you want one, it is a clean thing to rebuild.
- The Expo mobile app. The shared package is still mobile-ready (the API layer
  takes a client and the hooks are plain React), but no `apps/mobile` is
  included here.

**Also not here, and a deliberate stopping point: carts, orders and checkout for
the goods themselves.** The billing in this starter is for *memberships* — a
seller paying to hold listings — not for a buyer paying a seller. Adding
buyer-to-seller payment means an order lifecycle, fulfilment states, refunds,
disputes and (in most places) marketplace payout regulation, which is a project
rather than a feature. The natural seam is a new `orders` migration keyed on
`(listing_id, buyer_id)`, alongside `conversations`, using the same
record-before-you-act webhook pattern as `billing_events`.

## Adapting it

Three files are where a new project starts:

1. **`packages/shared/src/constants.ts`** — `CATEGORIES` is a shape, not a
   taxonomy anyone should inherit; `LISTING_CONDITIONS` likewise. Replace both,
   and the CHECK constraints in `20260101000200_listings.sql` with them.
2. **`apps/web/src/app/globals.css`** — six colour tokens. Names are load-bearing
   and appear throughout the components; only the values should move. Check that
   white text on `brand` clears 4.5:1 before shipping.
3. **`packages/shared/src/lib/onboarding.ts`** — the tour copy is written for a
   generic marketplace and is meant to be rewritten. The *structure* (one tour
   per role, keyed on the role rather than the profile) is the reusable part.

The vocabulary itself is the other obvious thing to change: `listing`, `buyer`,
`seller`, `advertiser`, `promoter` are consistent across the schema, the shared
package and the routes, so renaming one is a mechanical sweep. `listing` →
`product` is the most likely, and touches one table, one type, one API module
and four routes.
