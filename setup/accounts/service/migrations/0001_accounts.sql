-- Accounts, sessions and entitlements for every app on thewizardofoza.com.
--
-- Deliberately small. What is here is identity and "who bought what" — nothing
-- else. No app content: saved places, trips, decks and scores stay in
-- localStorage on the device (house rule 5). Signing in is not a backup, and
-- the Settings UI has to say so in plain words.
--
-- Apply with:  psql "$DATABASE_URL" -f migrations/0001_accounts.sql
-- It is idempotent, so re-running it is safe.

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

-- email is plain `text`, with case-insensitivity enforced by the unique index
-- below rather than by the citext type. citext would be tidier, but it is an
-- extension, and some managed Postgres restrict which extensions you may
-- create — so this keeps the schema portable across every option in SETUP.md
-- step 1. Every query compares lower(email), and the index below is what makes
-- that fast and what stops two rows differing only in case.
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  email_verified_at   timestamptz,
  display_name        text,
  -- scrypt output, as "scrypt$N$r$p$salt$hash". NULL for an account that only
  -- ever signed in with Google — which is most of them, and is why every
  -- password path has to cope with there being no password.
  password_hash       text,
  stripe_customer_id  text unique,
  created_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- This index is load-bearing, not an optimisation: it is what stops
-- "Me@example.com" and "me@example.com" becoming two accounts, which would
-- present as "I signed up and it says my address is taken, but I cannot sign
-- in". Partial on deleted_at so a deleted account's address can be reused.
create unique index if not exists users_email_lower_idx on users (lower(email))
  where email is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- identities — one human, many ways in
--
-- Keyed on (provider, subject), NEVER on email. Google's `sub` is stable and
-- immutable; email addresses change, get reassigned inside Workspace domains,
-- and are not unique across providers. An account keyed on email is an
-- account-takeover waiting for somebody to notice.
-- ---------------------------------------------------------------------------

create table if not exists identities (
  provider   text not null,            -- 'google' | 'password'
  subject    text not null,            -- Google's `sub`, or the user id for password
  user_id    uuid not null references users(id) on delete cascade,
  email      text,
  linked_at  timestamptz not null default now(),
  primary key (provider, subject)
);

create index if not exists identities_user_idx on identities (user_id);

-- ---------------------------------------------------------------------------
-- sessions
--
-- The token is stored HASHED. A leaked database dump should not be a set of
-- working logins — it is the same reasoning as not storing passwords, applied
-- to the thing that stands in for one.
-- ---------------------------------------------------------------------------

create table if not exists sessions (
  token_hash   text primary key,
  user_id      uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  user_agent   text
);

create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists sessions_expiry_idx on sessions (expires_at);

-- ---------------------------------------------------------------------------
-- password_resets
--
-- Hashed, single-use, short-lived. All three matter:
--   hashed      — a dump must not be a set of live reset links
--   single-use  — a link sitting in an inbox is otherwise a permanent key
--   short       — same reason; inboxes get compromised
-- ---------------------------------------------------------------------------

create table if not exists password_resets (
  token_hash  text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create index if not exists password_resets_user_idx on password_resets (user_id);

-- ---------------------------------------------------------------------------
-- entitlements
--
-- Keyed (user_id, app_slug): buying Wander does not unlock Popcorn. A bundle,
-- if ever wanted, is extra rows rather than a rewrite.
-- ---------------------------------------------------------------------------

do $$ begin
  create type entitlement_status as enum ('paid', 'refunded', 'comped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entitlement_source as enum ('stripe', 'manual');
exception when duplicate_object then null; end $$;

create table if not exists entitlements (
  user_id     uuid not null references users(id) on delete cascade,
  app_slug    text not null,
  status      entitlement_status not null default 'paid',
  -- 'manual' exists so a copy can be granted to a friend, a reviewer, or
  -- somebody whose payment went wrong, WITHOUT faking a Stripe charge. It is
  -- also the recovery path when a person loses the account they bought with:
  -- the Stripe receipt is the evidence, and it lives outside this database.
  source      entitlement_source not null default 'stripe',
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  -- How a refund finds this row. A `charge.refunded` event carries no checkout
  -- session — only a payment intent — so without this the webhook cannot tell
  -- which app to revoke, and a refunded customer keeps it forever.
  stripe_payment_intent text,
  primary key (user_id, app_slug)
);

create index if not exists entitlements_user_idx on entitlements (user_id);
create index if not exists entitlements_pi_idx on entitlements (stripe_payment_intent)
  where stripe_payment_intent is not null;

-- ---------------------------------------------------------------------------
-- webhook_events — idempotency for Stripe
--
-- Stripe retries anything it did not get a 2xx for, and can deliver the same
-- event more than once regardless. Without this, a retried
-- checkout.session.completed is a second grant, and a retried refund is a
-- revoke landing after a legitimate re-purchase.
-- ---------------------------------------------------------------------------

create table if not exists webhook_events (
  event_id     text primary key,
  type         text not null,
  received_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- oauth_states — CSRF protection for the Google round trip
--
-- In the database rather than in a cookie because the callback arrives from
-- Google, and a SameSite=Lax cookie is not guaranteed to survive every
-- cross-site redirect chain. Rows are single-use and expire in minutes.
-- ---------------------------------------------------------------------------

create table if not exists oauth_states (
  state       text primary key,
  return_to   text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
