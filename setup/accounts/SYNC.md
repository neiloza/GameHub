# Cloud save — how every app's data lives in Postgres

*Written 2026-09-22. The service and protocol have been exercised against a
real Postgres, including the conflict path; Google, Stripe and DNS still have
not run. See [What is proven](#what-is-proven-and-what-is-not).*

Every signed-in account's data for every app — Wander's trips, Forest's
sessions, Popcorn's favourites, Clash's decks — lives in one Postgres table,
and a new app needs **zero** server changes to join.

## The one decision everything follows from

**The device is the source of truth. Postgres is a durable, cross-device
mirror of it.**

Not the other way round, and the difference is not academic:

- **Most people never sign in.** Their data must work exactly as well as a
  signed-in user's, forever, with no account and no server.
- **The apps are offline-first.** A deck that will not deal on a plane because
  an API in Virginia is unreachable has thrown away the entire reason the app
  was built this way.
- **A service outage must cost nobody anything but sync.**

So `js/store.js` keeps doing exactly what it did. `js/sync.js` mirrors it in
the background when signed in. **Deleting `sync.js` must leave a working
app** — that is the test of whether this rule is still being honoured.

What this buys, which is what was actually wanted: data survives a lost phone,
appears on a second device, and comes back after a reinstall.

## The one table

```sql
app_data (user_id, app_slug, key, value jsonb, rev, seq, deleted, updated_at)
```

One generic table holds every app's data as **opaque JSON**. There is no
`clash_decks` table, no `forest_sessions` table.

**Why — and this is the part that answers "does it scale to new projects":**

- **A new app needs zero server changes.** No migration, no endpoint, no
  deploy. It picks an `app_slug` and starts writing. Anything else means every
  new game is also a backend task, and that is the thing that stops being done
  by app number four.
- **The server never parses an app's data**, so an app can bump its store
  version, add fields and run its own migrations without the service knowing.
  A server that understood app schemas would have to be redeployed in lockstep
  with every client, forever.
- **Each app already owns its migrations locally.** Duplicating that knowledge
  server-side is two sources of truth for one rule, which is how they drift.

**When to break this rule:** an app that needs the *database* to query across
users — a leaderboard, matchmaking, a global high score — gets a real,
purpose-built table for that one thing, alongside this one. JSONB is the right
default and the wrong hammer for a cross-user query. Clash's multiplayer is
the likely first case.

### What a document is

One row per **logical bundle** — `saved`, `trips`, `settings`, `collection` —
not one per record. Thousands of fine-grained rows would mean thousands of
requests and a merge per record. A handful of coarse documents means one push
and a merge the app can reason about.

## Conflicts — the part that decides whether anyone loses data

Two phones, both offline, both editing. This is not an edge case; it is
Tuesday.

**Every write declares the revision it was based on.** If the stored revision
has moved on, the write is **refused** and the server returns its copy. The
client merges and retries.

```
phone A  base_rev 1  →  ok, rev 2
phone B  base_rev 1  →  CONFLICT, here is rev 2
phone B  merges, base_rev 2  →  ok, rev 3     ← nobody lost anything
```

Without this, the second write silently overwrites the first, with no error
anywhere and no way to recover — the losing copy is simply gone. That is the
classic way a sync system quietly destroys somebody's work, and it is the
single most important thing this design prevents.

### The default merge is UNION, not last-write-wins

Last-write-wins is the obvious choice and it is **wrong** for most of what
these apps hold.

The default merges id-keyed objects by union, which is what the house data
shape already is: `saved` and `skipped` are maps of `id → timestamp`, trips
are keyed by id — because [rule 5](../APP_DESIGN_RULES.md) already says *store
decisions, never content*. **That rule, written for a different reason, is
what makes safe merging possible.**

Union two of those and nobody loses anything. Worst case, a place one device
removed reappears — visible, understandable, and fixable by the user in one
tap. Compare that to a month of Forest sessions vanishing.

Arrays are replaced, never concatenated (concatenating doubles the list on
every sync). Scalars take the newer value. Override per document when that is
wrong for your app:

```js
documents: {
  saved:    { read, write },                         // union — the default
  settings: { read, write, preferLocal: true },      // this device wins
  history:  { read, write, merge: myMergeFn },       // app-specific
}
```

## Wiring an app up

```js
import { createSync } from "./js/sync.js";

const sync = createSync(account, {
  apiUrl: "https://api.thewizardofoza.com",
  appSlug: "wander",
  documents: {
    saved: { read: () => state.saved,  write: (v) => { state.saved = v; persist(); } },
    trips: { read: () => state.trips,  write: (v) => { state.trips = v; persist(); } },
  },
  onChange: () => render(),    // remote data arrived; redraw
});

sync.start();                  // launch, foreground, and back-online triggers
```

Then call `sync.touch()` after every local write. It is debounced, cheap, and
a no-op when signed out.

**Do not make any of this blocking.** No `await` in the boot path.

## Adapting the existing apps

Each needs an adapter deciding *which* parts of its state to mirror, not a
rewrite.

| App | Documents | Watch out for |
|---|---|---|
| **Wander** | `saved`, `skipped`, `trips`, `filter` | Already id-keyed maps; unions cleanly. Do not sync `filter` — a phone and a laptop want different filters |
| **Popcorn** | `favorites`, `settings` | Favourites are id-keyed. Fine |
| **Forest** | `sessions`, `trees`, `settings` | The one to be careful with: **months of sessions, and losing them is the worst outcome in the estate.** Sessions are append-only, so key them by id and union. Watch the 1MB document limit — split by year if it gets close |
| **Clash** | `collection`, `decks` | Has bespoke parsers and migrations. The adapter must go **through** those, not around them |
| **Liberty** | — | Server-backed already. Not a candidate |

**Forest also has a constraint the others do not:** its `app.js` is `var`/
function style for Android WebView compatibility. `sync.js` is a module using
modern syntax, so either the adapter bridges it or Forest gets a transpiled
copy. Decide before starting, not halfway.

## Cloud save is part of the $5 unlock

Decided 2026-09-22. It is the one feature in the estate with a real, ongoing
server cost, so charging for it is honest in a way that charging for a local
feature would not be — [rule 7](../APP_DESIGN_RULES.md) makes exactly that
distinction.

**What it must never mean:** a free user loses nothing. Their data lives on
the device exactly as it always did, and **Download backup is still never
paywalled**. The paid feature is the *mirror*, not the data. If that ever
stops being true, the paywall has started holding data hostage, which rule 7
forbids outright.

Mechanically: `sync()` returns early unless `signedIn() && isPaid(appSlug)`.
Buying while signed in is its own trigger — that device has local data that
has never been mirrored, so it gets a full sync immediately. And because
`isPaid()` reads a cache that persists a *paid* answer but not an *unpaid*
one, a paying customer on a plane keeps syncing when the signal returns
rather than being silently downgraded mid-flight.

The account sheet says this to a signed-in free user, and says the reassuring
half too — the obvious fear on seeing "cloud save" behind a paywall is that
your data is at risk until you pay, and it is not.

## A sync must not trigger another sync

Found by running two clients against the real service, and it was real: **20
pushes across 20 idle syncs with nothing changed.**

Merging writes through the app's `persist()`, which calls `touch()`, which
schedules a push. So:

```
A pulls → merges → writes → pushes
B pulls that → merges → writes → pushes
A pulls that → …
```

Two devices left open sync each other **forever** — continuous traffic,
battery drain and an inflating sequence, while nothing has changed.

`sync.js` fingerprints the serialised value and skips **both** ends: an
unchanged merge does not write, and an unchanged document is not pushed.
`JSON.stringify` is key-order sensitive, so it can report a false *change* —
one redundant push, harmless. It can never report a false *unchanged*, which
is the direction that would lose data.

`service/test/pingpong.test.mjs` drives two real clients against an
in-process stub and fails if idle syncs write anything. Confirmed to go red
when the check is removed.

## Sign-out must clear the sync state

`sync.reset()` runs on sign-out, and on signing in as a different account. It
is not tidiness — it is a bug fix, and the bug is nasty:

**`seq` comes from one global sequence shared by every user.** If a device
keeps the first person's cursor after they sign out, the second person pulls
`since=<a number higher than any row of their own>` and receives **nothing**.
Their data appears to be gone, on a shared phone, with no error anywhere.

The stored revisions are the same story in a different field: they describe
another account's documents, so every push conflicts against rows that are not
theirs.

Local app data is deliberately untouched by this. Signing out is not a request
to delete the trips on the phone.

## Limits

| | |
|---|---|
| One document | 1 MB |
| One account, all apps | 50 MB |
| Documents per push | 50 |

Deliberately generous: this catches a runaway loop, not honest use. Forest
carrying months of sessions is exactly the case that must **not** be refused.
Over the limit returns a clear message saying the data is still safe on the
device.

## What this changes about privacy

**Say this plainly because it is a real change.** The server used to hold an
email address and a purchase history. It now holds *what people did* — where
they planned to go, how long they focused, what they saved.

That is a material change to the estate's privacy posture, and it is why:

- **Account deletion now deletes something real** and must actually run.
- **There is still no analytics, no tracking, no third-party anything.**
  Storing what somebody asked you to store is not surveillance; the line is
  that this data exists to be *given back to them on another device* and for
  nothing else.
- **Say it in the UI.** Settings should state that signing in syncs data to
  the account, and that Download backup still exists.

**End-to-end encryption was considered and rejected**, for now: the key would
have to come from the password, so *forgetting a password would mean losing
every app's data permanently* — a far worse failure for a $5 consumer app than
the risk it mitigates. If an app ever holds something genuinely sensitive, it
should get client-side encryption **for that app**, with the trade explained
to the user, rather than the whole estate paying for it.

## What is proven, and what is not

**Proven against a real Postgres** — driven end to end with curl:

- push, delta pull by cursor, tombstones that propagate without leaking the
  deleted contents
- **the conflict path**: a stale write refused with the server's copy, then
  accepted after a merge, with all three records surviving
- app isolation (Popcorn cannot see Wander's rows)
- **cross-user isolation** — a second account pulling the same app gets
  nothing
- the per-document size limit, with a message that says the data is still safe
- 401 when signed out

**Proven by unit test:** the merge rule, including the cases that would lose
data — two offline devices both keeping their saves, a missing side never
being read as "delete everything", inputs never mutated. Plus the shared-device
cursor bug above, which is why `reset()` exists.

**NOT proven:**

- **No app has been adapted yet.** The table above is a plan.
- **Two real devices have never synced.** Only a browser settles that.
- Nothing has run against a deployed service — see
  [`README.md`](./README.md).
- The 50 MB account limit is a guess. Watch what Forest actually uses.

**The first thing to do on a real deployment:** sign in on two browsers, save
different things in each while one is offline, bring it back, and confirm
**both** sets survive. That is the whole feature. If it fails, nothing else
here matters.
