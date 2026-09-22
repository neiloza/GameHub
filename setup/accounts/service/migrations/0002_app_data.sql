-- Cloud save: every app's data, for every signed-in account.
--
-- THE DESIGN DECISION THIS TABLE ENCODES, because everything else follows
-- from it: ONE generic table holds EVERY app's data as opaque JSON. There is
-- no clash_decks table, no forest_sessions table, no popcorn_favorites table.
--
-- Why, stated plainly so nobody "improves" it into per-app tables later:
--
--   * A new app needs ZERO server changes. No migration, no endpoint, no
--     deploy. It picks an app_slug and starts writing. That is what "expands
--     seamlessly into the rest of our services" actually requires — anything
--     else means every new game is also a backend task.
--   * The server never needs to understand an app's schema, so an app can
--     bump its own store version, add fields and run its own migrations
--     without the service knowing or caring. A server that parsed app data
--     would have to be redeployed in lockstep with every client, forever.
--   * Each app already owns its migrations locally (store.js). Duplicating
--     that knowledge server-side is two sources of truth for one rule, which
--     is how they drift.
--
-- WHEN TO BREAK THIS RULE: an app that needs the DATABASE to query across
-- users — a leaderboard, matchmaking, a global high score — should get a
-- real, purpose-built table for that one thing, alongside this one. JSONB is
-- the right default and the wrong hammer for a cross-user query. Clash's
-- multiplayer, if it arrives, is the likely first case.
--
-- WHAT THIS IS NOT: the source of truth. The device is. See SYNC.md — these
-- apps are offline-first, most users never sign in, and a service outage must
-- never stop an app working. This table is a durable, cross-device MIRROR.

create table if not exists app_data (
  user_id     uuid   not null references users(id) on delete cascade,
  app_slug    text   not null,
  -- The app's own name for this document. One row per logical bundle:
  -- "saved", "trips", "settings", "collection". NOT one row per saved place
  -- — see SYNC.md on why a handful of coarse documents beats thousands of
  -- fine ones for a local-first app.
  key         text   not null,
  value       jsonb  not null,

  -- OPTIMISTIC CONCURRENCY. A write must declare which revision it is based
  -- on; if the stored rev has moved on, the write is refused and the client
  -- merges. Without this, two devices that were both offline silently
  -- overwrite each other and the loser's data is gone with no error anywhere
  -- — the single most common way a sync system loses somebody's work.
  rev         bigint not null default 1,

  -- A monotonic cursor so a client can ask "what changed since I last
  -- looked" instead of downloading everything on every launch. From one
  -- global sequence: it only has to be monotonic, not gapless.
  seq         bigint not null,

  -- A tombstone, not a DELETE. A row that simply vanishes cannot be
  -- distinguished by another device from a row it has never seen, so the
  -- delete never propagates and the data resurrects on the next sync.
  deleted     boolean not null default false,

  updated_at  timestamptz not null default now(),
  -- Which device wrote this. Only for debugging "why did my data change" —
  -- never used for merge decisions, because clocks on phones are not to be
  -- trusted for ordering.
  writer      text,

  primary key (user_id, app_slug, key)
);

create sequence if not exists app_data_seq;

-- The delta-pull index. This is the query every app makes on every launch,
-- so it is the one that has to be fast.
create index if not exists app_data_cursor_idx
  on app_data (user_id, app_slug, seq);

-- ---------------------------------------------------------------------------
-- Quotas
--
-- A per-user total, enforced in the service rather than here (a trigger would
-- make every write do a table scan). These columns let the service answer
-- "how much is this account using" in one indexed read instead of summing
-- JSONB on every request.
--
-- Deliberately generous: the point is to catch a runaway loop writing a
-- megabyte a second, not to ration honest use. Forest carrying months of
-- sessions is exactly the use case this must NOT refuse.
-- ---------------------------------------------------------------------------

create table if not exists app_data_usage (
  user_id     uuid primary key references users(id) on delete cascade,
  bytes       bigint not null default 0,
  rows        integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Account deletion now deletes something real.
--
-- Before this migration a user row held an email and a purchase history.
-- Now it holds somebody's forest, their trips and their decks. The cascade on
-- user_id above handles it, but the point is worth writing down: "delete my
-- account" is no longer a formality, and it must actually run.
-- ---------------------------------------------------------------------------
