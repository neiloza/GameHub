# The app blueprint

**How every app in this estate gets built.** GameHub is the central
repository, so this is the copy of record — the version in `testchild` is
where it came from, not where it lives.

If you are about to start an app, or to change one, read
[Start here](#start-here) and nothing else until you need it.

## The four documents

| File | What it answers | When to read it |
|---|---|---|
| **[`APP_DESIGN_RULES.md`](./APP_DESIGN_RULES.md)** | What every app does, and why | Before app #1, and when tempted to break a rule |
| **[`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md)** | Accounts, payments, the API, the database, every credential | Before wiring sign-in or money into anything |
| **[`LESSONS.md`](./LESSONS.md)** | Bugs already found and paid for, indexed **by symptom** | **Before debugging anything.** Look up what you are seeing |
| **[`starter-kit/`](./starter-kit/)** | A working PWA that already obeys the rules | `scripts/new-app.sh` and you are past the plumbing |

Plus [`UPGRADE_PLAN.md`](./UPGRADE_PLAN.md), which is history: the 2026-08-20
plan for bringing the pre-existing apps (Liberty, Clash, Forest, Popcorn) up
to this standard. Forest and Popcorn live in this repo, so parts of it are
still live work.

## Start here

**Starting a new app:**

```bash
app-blueprint/starter-kit/scripts/new-app.sh ../myapp "My App" myapp "#RRGGBB" "MyApp"
cd ../myapp && npm install && npm test
```

Then work in this order — it is the order that stops you redoing things:

1. `icons/source.svg`, then `npm run icons`. The kit ships a placeholder star.
2. `css/tokens.css` — the palette, named by role.
3. `manifest.webmanifest`, then `index.html`.
4. `js/store.js` — `defaultState()` is the shape of a brand-new user.
5. `CLAUDE.md` — the file map and the invariants, **while you still remember
   them**. Its *Waiting on a human* section ships pre-filled with what a fresh
   app is genuinely blocked on.
6. Accounts and the $5 unlock only once the app is worth buying. See
   [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md); the client half belongs in the
   kit, not in your app.

**Something is broken:** go to [`LESSONS.md`](./LESSONS.md) and look up the
**symptom** in the table at the top, not what you think the cause is. That
table exists because in almost every case here the symptom and the cause were
in different parts of the app.

**Before you debug at all**, three things, in this order:

1. **Get the build number off the device.** A screenshot that cannot date
   itself is not evidence — three debugging rounds were spent not knowing
   whether a bug or a stale install was being looked at.
2. **Check `docs/BUGLOG.md`** in the app you are working on. The thing you are
   about to try may already be in there marked *RULED OUT* or *MADE IT WORSE*.
3. **Remember that finding a mechanism is not confirming a cause.** Say which
   one you have.

## What this is in one paragraph

An installable, offline-capable, phone-first web app, with no tracking, that
lives on its own subdomain of one shared apex domain and stores the user's
data on the user's device. No build step, no framework, no runtime
dependencies. A free version that is genuinely complete, and a one-time $5
unlock, served by **one** shared accounts-and-payments API that every app
talks to and no app contains.

## Where this came from

- **`APP_DESIGN_RULES.md`** was derived by reading five shipped apps end to
  end — Liberty, Forest, SlotMachine, Popcorn, Clash of History — and writing
  down what all five already did. Almost every rule is a description, not an
  invention.
- **`LESSONS.md`** comes from **Wander** (the `Wonder` repo), the sixth app
  and the first built on the kit. It is the record of what the rules did
  *not* cover: thirteen attempts at one bug, and everything learned on the way
  through.
- **`INFRASTRUCTURE.md`** is new, written 2026-09-21, and is the one part of
  this blueprint that is a **plan rather than a description**. Nothing in it
  has been built yet. Treat its specifics as carefully-reasoned and
  **unverified against the real services** — which is precisely the failure
  mode `LESSONS.md` P5 is about, and why it says so in its own text.

## Keeping it honest

Three rules for this folder itself, all earned:

- **Date anything that describes a state of play.** *"A status note nobody
  dated is a status note nobody trusts."*
- **A rule that gets broken deliberately gets its reason written down**, in
  the app, not here. The fix for a justified exception is the paragraph, not
  the code.
- **When these documents and an app disagree, the app is the fact and this is
  the claim.** Fix the document.
