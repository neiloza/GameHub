# Bugs already paid for

*Written 2026-09-21, from **Wander** (the `Wonder` repo) — the sixth app and
the first built on the starter kit. Every entry below is a bug that actually
happened, was actually diagnosed, and cost real time. None of them should ever
have to be discovered again.*

The headline number, for calibration: **one bug — photographs not appearing —
was "fixed" and shipped thirteen times.** Twelve of those thirteen were
reasoned from the code without ever seeing the real API's response. The
thirteenth was found from one real API response and took ten seconds to
understand. That ratio is what
[Part 0](#part-0--process-the-six-rules-that-would-have-saved-the-most-time) is
about, and it is the most valuable thing in this document.

## How to use this file

**Look up your symptom, not your suspicion.** Most of these bugs present as
something vague — "it's broken", "I have to swipe twice", "photos look
blurry" — and the whole reason they cost so much is that the symptom and the
cause were in different parts of the app.

| What you are seeing | Go to |
|---|---|
| "I fixed it and it's still broken on my phone" | [1.1](#11-a-fix-must-be-able-to-reach-the-phone), [P3](#p3-put-the-build-number-in-the-ui-and-read-it-from-the-cache) |
| Works locally, broken in production, nothing in the console | [1.6](#16-csp-connect-src-is-not-covered-by-img-src-and-csp-governs-the-service-worker), [1.7](#17-a-third-party-can-answer-with-a-hostname-your-csp-does-not-allow), [2.2](#22-an-icon-whose-real-size-disagrees-with-the-manifest-is-silently-uninstallable) |
| Install the app, go offline, it's empty | [1.3](#13-precache-large-data-after-activation-never-via-the-fetch-handler), [1.4](#14-verify-the-shell-list-by-walking-the-import-graph) |
| The install offer never appears | [2.1](#21-icons-are-generated-and-byte-verified-never-hand-edited), [2.2](#22-an-icon-whose-real-size-disagrees-with-the-manifest-is-silently-uninstallable) |
| A user's data vanished after an update | [3.2](#32-a-new-field-needs-a-default-even-when-it-needs-no-version-bump), [3.5](#35-renaming-the-app-renames-the-storage-key-which-abandons-everyones-data), [3.6](#36-an-enum-value-the-ui-no-longer-recognises-reads-as-lost-data) |
| A control looks fine and selects nothing | [3.7](#37-two-controls-that-answer-the-same-question-must-clear-each-other) |
| "I have to swipe twice" | [4.1](#41-no-global-flag-may-span-an-exit-animation) |
| Swipes silently do nothing | [4.2](#42-commit-on-distance-or-speed-and-measure-speed-over-the-fastest-stretch), [4.3](#43-a-cancelled-gesture-is-still-a-gesture) |
| The list won't scroll under my thumb | [4.4](#44-a-swipeable-row-inside-a-scrolling-list-must-lock-to-one-axis) |
| Tapping a child element does the parent's action | [4.5](#45-with-pointer-capture-a-tap-on-a-child-must-be-routed-by-the-gesture-handler) |
| Text cut off mid-word with no scrollbar | [5.1](#51-on-a-flex-column-the-text-must-not-lose-to-the-media) |
| A big empty hole in the layout | [5.2](#52-when-a-block-is-removed-its-space-has-to-go-somewhere) |
| Off by one day | [6.1](#61-never-new-dateyyyy-mm-dd), [6.2](#62-an-all-day-dtend-is-the-day-after-the-last-day) |
| Tests pass, app is broken | [7.3](#73-a-stub-written-from-the-same-reasoning-as-the-code-cannot-falsify-it), [7.4](#74-assert-the-promise-not-the-mechanism), [P5](#p5-a-stub-written-from-the-same-reasoning-as-the-code-cannot-falsify-it) |
| "58/61 passed" and something is broken | [7.1](#71-a-truncated-test-run-must-fail-expected_checks) |
| A remote resource won't load and there's no error anywhere | [8.1](#81-a-404-inside-an-img-is-completely-silent), [8.3](#83-every-request-needs-a-deadline-and-the-deadline-must-be-generous) |
| Some load, many don't | [8.2](#82-a-derived-or-resized-url-always-needs-a-fallback-chain) |
| It was broken once and now it's broken forever | [8.4](#84-a-failed-lookup-is-not-a-verdict-about-the-thing), [8.5](#85-an-empty-answer-is-never-written-to-the-device), [P6](#p6-a-fix-must-heal-the-records-already-on-the-device) |
| A batch script reports "no network" on a working connection | [8.7](#87-classify-a-failure-by-cause-not-by-symptom) |

### Tags

- **[KIT]** — will hit any app built from this kit. Most of them.
- **[GENERIC]** — Wander happened to find it; the lesson is not app-specific.
- **[WONDER]** — specific to its Wikimedia photo pipeline, kept because the
  kernel inside it transfers.

### Contents

- [Part 0 — Process](#part-0--process-the-six-rules-that-would-have-saved-the-most-time)
- [Part 1 — Getting a fix onto the phone](#part-1--getting-a-fix-onto-the-phone)
- [Part 2 — Icons, manifest, installability](#part-2--icons-manifest-installability)
- [Part 3 — The store and migrations](#part-3--the-store-and-migrations)
- [Part 4 — Gestures and touch](#part-4--gestures-and-touch)
- [Part 5 — Layout](#part-5--layout)
- [Part 6 — Dates](#part-6--dates)
- [Part 7 — Test-suite design](#part-7--test-suite-design)
- [Part 8 — Talking to anything over a network](#part-8--talking-to-anything-over-a-network)
- [Part 9 — A shipped content catalog](#part-9--a-shipped-content-catalog)
- [Appendix — the thirteen attempts](#appendix--the-thirteen-attempts)

---

## Part 0 — Process: the six rules that would have saved the most time

Not code. These are worth more than everything below them put together,
because they are what turns thirteen attempts into two.

### P1. Keep a `docs/BUGLOG.md`, with a closed vocabulary for outcomes

**[KIT]**

**Symptom:** the same fix gets proposed and shipped three times. A person's
afternoon is spent re-testing an idea that was ruled out two rounds ago.

**The rule:** *when a bug comes back a second time, it gets an entry in
`BUGLOG.md` **before** it gets a fix.* Write the hypothesis and the change
first; come back afterwards and write what actually happened.

Each attempt records date, commit, hypothesis, change, and an outcome from a
**fixed list** — the closed vocabulary is what makes the file scannable:

- **CONFIRMED FIXED** — someone verified it on the real device. *Only a human
  with the thing in their hand can write this.*
- **SHIPPED, UNVERIFIED** — the change is in, the reasoning is sound, nobody
  has confirmed anything. **This is the honest default**, and twelve of
  Wander's thirteen entries are this.
- **RULED OUT** — evidence showed this was not the cause. Say what the
  evidence was.
- **MADE IT WORSE** — say so plainly. *These are the most valuable entries in
  the file*, and the ones nobody volunteers.

Two standing sections at the bottom, worth as much as the attempts: **"What is
still NOT known"** and **"What would settle it, cheapest first."**

### P2. "Found a mechanism" is not "confirmed the cause"

**[KIT]**

**Symptom:** an agent declares a bug fixed; the user tests it on a phone; it
is still broken. Repeat until nobody believes a "fixed" again. Wander
*"shipped 'fixed' three times on that mistake."*

**The rule, verbatim from its BUGLOG:** *"Never upgrade an entry to CONFIRMED
FIXED because the reasoning got better."*

Note how far this is taken: even attempt 12, the first with a **local
reproduction** behind it, is held back — *"It is the first entry here with a
reproduction, which is a different kind of claim from the eleven above it, and
it is still not a confirmation."*

A found mechanism is a hypothesis with good manners. Real confirmation needs a
check against the real world, which means it belongs on the **Waiting on a
human** list, not in a commit message.

### P3. Put the build number in the UI, and read it from the cache

**[KIT]**

**Symptom:** "is that fixed?" asked three rounds running, against screenshots,
with no way to tell a live bug from a stale install. One screenshot sent as
proof the app was broken showed a layout a commit already on `main` had
removed — *"the phone could not have been running current code."*

**Fix:** `js/version.js` is the single source of truth. The version renders
**in the toolbar** next to the wordmark, and Settings prints the full line —
**read from `caches.keys()`, not from a constant.** That detail is the whole
point: a page shipped with the new number but served from the old cache would
otherwise report the number it was *built with* rather than the one it is
*running*, which is precisely the case worth catching.

`check-deploy.mjs` fails the build if `js/version.js` drifts from `CACHE` in
`sw.js` — *"bumping the version without bumping the cache is worse than having
no version."*

**The operational rule: ask for the build line before diagnosing anything.** A
screenshot that cannot date itself is not evidence.

### P4. Two lists, and enforce the boundary

**[KIT]**

*What to do next* (an agent can finish it alone) and *Waiting on a human*
(a credential, a device, a judgement, a check against the real world). Rule 11b
of the house rules already says this; Wander is the proof of why it matters.

Each blocked entry carries the exact steps **and a `Trap:` line** — the thing
that produces a wrong result rather than an error:

> *"An importer that dislikes a file usually imports NOTHING and says nothing.
> A calendar that looks unchanged means the file was rejected — that is a
> failure, not a no-op."*

> *"A site that redirects a bad query to its homepage returns 200, so nothing
> automated can tell it went wrong. Only eyes can."*

One permanent entry, never ticked: *"Re-read this list when you pick the
project back up. Entries go stale silently."*

### P5. A stub written from the same reasoning as the code cannot falsify it

**[KIT]**

**This is the big one, and it applies directly to Google, Apple and Stripe.**

**Symptom:** twelve consecutive fix attempts missed the actual cause. Full
local suite green; every photograph broken in production.

**Root cause:** the agent sandbox cannot reach the third party (403 on
CONNECT), so the smoke test's stub served the hostname *the code was written
against* — and agreed with the code perfectly, while **6,907 of 7,827 real
URLs came back on a different host.** In its own words: *"the stub could not
falsify the belief that produced it."*

**The rules:**

- Any claim about a third-party API that has only ever been checked against
  **your own stub** is an assumption, and must be **labelled as one in the
  docs** — not stated as fact.
- Ship a script that runs **the app's own module** against the real service
  (Wander's `scripts/check-photos.mjs --pipeline`), and put running it on the
  Waiting-on-a-human list.
- **A verification tool must exercise the same *environment*, not just the
  same *endpoint*.** `check-photos.mjs` alone also missed the CSP bug, because
  it fetched URLs directly in Node, *"where there is no CSP."*

See [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md) — the CSP host list for the
sign-in and payment SDKs is written from documentation and is explicitly
flagged as a hypothesis to be checked in a real browser console. That flag is
this lesson.

### P6. A fix must heal the records already on the device

**[KIT]**

**Symptom:** a fix ships, the user sees no change, reports "still broken."
Happened twice, in attempts 5 and 7.

**Root cause:** every phone that has ever run the app is carrying bad records
written by a *previously shipped* build. A fix that only helps first-time
lookups *"would have fixed nothing anyone could see."*

**The rules:** when persisted state caused the bug, the fix must (a) re-read
old records as **unknown** rather than as a verdict, and (b) **clear
superseded storage keys**. Held by a smoke test that **plants an old poisoned
record before a reload and fails if it does not recover.**

### The rest of Part 0, briefly

- **Instrument before you guess again.** After ten attempts produced no
  diagnosis, attempt 11 shipped **an instrument, not a fix**: the failure
  records *why* it ended as it did and the UI prints it. *"A screenshot is now
  a report."* Because *"'no photos' is at least four different bugs, and they
  have opposite fixes."*
- **Ship an in-app self-test, and make it copyable.** A phone has no console,
  and *"the person holding the phone is rarely the person who can act on it."*
  Time every stage independently and print counts — *"`looked up 200, 0 have a
  photo` is a pipeline running and failing; `looked up 0` is one not running at
  all."*
- **A verdict that contradicts the lines above it is worse than no verdict.**
  A real self-test printed two FAILED hops and then *"Photos are working end
  to end"*, because `painted` was an `||`. Acting on it *"would have been a day
  spent editing entries that were fine — which is the exact failure this
  self-test was written to stop, and it made it anyway."* **Every line the
  report prints must feed the verdict.**
- **Date the status section.** *"A status note nobody dated is a status note
  nobody trusts."* A link checker can verify docs point at real things; it
  cannot verify what they say is still true.
- **One source of truth for any rule two programs share.** Wander's image
  baker *imports* the app's own module rather than reimplementing its rules —
  the second copy had **already drifted** and would have reported a photo for
  a card that shows a placeholder. *"It came with a comment asking whoever
  changed one to change the other, which is a promise nobody keeps."* Same
  move: the test imports the validator's `PLAN`; the validator reads the
  allowed hosts **out of `_headers`**.
- **Do not pipe a test run through `tail`.** A commit shipped with a red
  check, because *"the pipe reported tail's exit code, not the suite's."*
- **Print a target as a gap; do not enforce it as a failure.** *"A target that
  fails the build on day one just gets lowered."*
- **Keep the noisy checker out of `npm test`.** Wander's catalog audit is
  deliberately excluded: *"every finding is a judgement call rather than a
  failure, and a check that cries wolf 1,900 times is a check people stop
  running."*

---

## Part 1 — Getting a fix onto the phone

### 1.1 A fix must be able to reach the phone

**[KIT]**

**Symptom:** *"'it is fixed' and 'it is still broken' were both true at once,
three times."* The user is testing yesterday's bytes.

**Root cause:** a stale-while-revalidate worker keeps running the bytes it
booted from until the next launch. *"That is right for a new place and wrong
for a bug fix."* And **a standalone PWA on iOS has no reload gesture at all**,
so there is genuinely no way out from inside the app.

**Fix:** ask for a newer worker **on every launch and every return to the
foreground**, and offer a tappable *"tap to reload"* when one takes over.
**Offering, not doing** — a reload under someone mid-gesture is its own bug.
Recorded honestly: *"it cannot fix the launch that installs it."*

The kit's default is network-first, which does not have this problem. If you
depart from the default, ship the update prompt with it.

### 1.2 `sw.js` must be served `no-store`

**[KIT]**

**Symptom:** a broken app that survives the deploy meant to fix it. *"The only
user-side cure is clearing site data."*

**Fix:** `Cache-Control: no-store, must-revalidate` on `/sw.js` in `_headers`.
*"Browsers already refuse to cache `sw.js` for more than 24 hours, but 24
hours of a broken app is 24 hours too many."* The deploy check fails on a
weakened `no-store`, and `DEPLOY.md` has a curl check labelled **THE IMPORTANT
ONE**.

### 1.3 Precache large data **after activation**, never via the fetch handler

**[KIT]**

**Symptom:** *"install the app, go offline, and the deck is empty"* on a fresh
install — the one failure the whole worker exists to prevent.

**Root cause, and this is a real bug rather than a theoretical one:** on a
first visit **the page issues its module imports BEFORE the worker takes
control**, so the fetch handler never sees them and the data files are never
cached. Putting them in `SHELL` instead is also wrong: `SHELL` blocks
activation, so a megabyte there delays the worker on every install.

**Fix:** a `warmCatalog()` that runs after `clients.claim()`, off the critical
path. The smoke test's offline section fails if this regresses.

### 1.4 Verify the `SHELL` list by walking the import graph

**[KIT]**

**Symptom:** *"the app works perfectly until someone installs it and opens it
on a plane."*

**Root cause:** a module missing from `SHELL` is also never seen by the fetch
handler, for the same reason as 1.3. Adding one new module prompted a check,
and *"what it immediately found is that two others have been missing all
along."*

**Fix:** the deploy check walks the app's import graph and fails if any module
is absent from `SHELL`. *"Walking the graph means nobody has to remember."*

### 1.5 The worker's cross-origin handler must never reject

**[KIT]**

**Symptom:** a blank frame **with nothing in the page console** — *"the worker
has its own, which nobody has open on a phone."*

**Root cause:** *"a rejected promise passed to `respondWith()` is a network
error."* Things that throw: opening the cache in private mode, `cache.put` on
an opaque response.

**Fix:** every step that can throw falls back to a plain `fetch`.

### 1.6 CSP: `connect-src` is not covered by `img-src`, and CSP governs the service worker

**[KIT]**

**Symptom:** *"every local test passes, no violation event fires in the page,
and every photo breaks in production."*

**Root cause, from `_headers` itself:** *"This policy applies to `sw.js` too,
and inside the service worker a photo is not an `<img>` — it is a `fetch()`,
so it is governed by `connect-src` rather than `img-src`. Leaving it out fires
no violation event in the page (the block happens in the worker, which has its
own console)."*

**Rule:** when you add a third-party origin, add it to **`connect-src` AND
`img-src`**, and assert the exact directive in the test suite.

**Run the whole suite through the real production `_headers`.** *"The policy
is strict enough to break the app, and the alternative is finding out on a
phone with no console open."* This is what caught the bug before launch — and
it is the single most transferable thing in this section, because accounts and
payments add three new origins across five directives.

### 1.7 A third party can answer with a hostname your CSP does not allow

**[GENERIC]**

The thirteenth attempt, and **the only one found from real evidence rather
than from reasoning.**

**Symptom:** every card shows the placeholder, all at once, nothing in the
page console.

**Root cause:** the API answers with URLs on one host; the CSP named a
*different* host from the same vendor. **The browser refused every image
before a request was made.** 88% of the baked URLs carried the unlisted host.
*"Nothing in this repository produces either. The API answers with them, and
every copy of the pipeline wrote them down as given."*

**A second bug in the same URL:** the API appended a `?utm_source=…` query, and
the resize helpers rewrite a path segment **anchored to the end of the
string** — so *"every resize in the app had silently stopped happening."*

**Fix, and the generalizable shape:** **never trust a third-party URL verbatim
— normalise it at a single seam** where an API answer becomes a URL your app
uses, so nothing downstream needs to know. Then **cross-check your shipped
data against your own security policy in CI** (the validator reads the allowed
hosts out of `_headers` rather than repeating them).

**The rejected alternative, and why:** widening the CSP to admit the new host
*"is worse twice over: one more origin to trust, and it would have left the
query breaking every resize."*

Third lesson, free: an anchor-at-the-end string rewrite breaks the moment a
query string appears.

### 1.8 Deploy traps on a static host

**[KIT]**

- **A `package.json` in the repo makes Cloudflare offer to run `npm run
  build`. That script does not exist and the deploy fails.** Framework preset
  **None**, build command **empty**, output directory `/`.
- **Cloudflare offers to take over the whole DNS zone — decline.** Other apps
  share the apex domain; adding a subdomain must stay one CNAME.
- If `_headers` appears not to take effect, *"the most common cause is that
  the build output directory is not `/`, so Pages published a subfolder and
  never saw the file at the root."*
- **The manifest must be served as `application/manifest+json`** or the
  install offer never appears.
- A no-build deploy publishes **the whole repo** — `docs/`, `scripts/`,
  `test/`, `CLAUDE.md` — over HTTP. Mark them `noindex` in `_headers` and
  disallow in `robots.txt`. A conscious trade, not an accident.

### 1.9 `Cache-Control` on your own code must not defeat the worker

**[KIT]**

`/js/*` and `/css/*` are `public, max-age=0, must-revalidate` — not "no
caching": the browser keeps the bytes and sends a conditional request, so an
unchanged file costs a 304 and no body. **A long `max-age` would mean the
worker's background refresh reads the browser's own cache and never sees a new
deploy** — *"a deploy would take days to reach anyone instead of one launch."*

---

## Part 2 — Icons, manifest, installability

### 2.1 Icons are generated and byte-verified, never hand-edited

**[KIT]**

Three rules from the builder, all *"learned the hard way"*:

1. **Everything full-bleed and fully opaque.** *"An icon with alpha, or with a
   'ground' band baked in from an older source, shows up as a clipped mark or
   a transparent tile on a home screen."* The builder byte-verifies opacity
   before writing, which is exactly why hand-editing a PNG is forbidden — it
   bypasses the check.
2. **The maskable copy is not optional.** *"Given only `any` icons, an Android
   launcher declines to crop and shrinks instead — letterboxing your mark onto
   a white tile beside every other app on the phone."* Keep meaningful art
   inside the centre 80% circle.
3. **Chrome's installability criteria require a 192 **and** a 512 PNG.** *"An
   SVG does not satisfy them — without both, everything else can be in order
   and the install offer simply never appears."*

Also: **design the mark for the size it is drawn at.** Wander's clouds *"read
as grey smudges at 192px and crowded the one shape carrying the idea."* They
were deleted.

### 2.2 An icon whose real size disagrees with the manifest is silently uninstallable

**[KIT]**

**Symptom:** everything looks right, and the install offer never appears.
Nothing on the console.

**Root cause:** *"Chrome's install criteria check the DECLARED size."*

**Fix:** the deploy pre-flight reads the **actual pixel dimensions out of the
PNG's IHDR chunk** and fails on a mismatch. It checks four more things that
are each invisible in local development: a file referenced by the HTML,
manifest or worker that is not in the repo (*"locally you may have it; the
deploy will 404 it"*); inline script or style the CSP forbids; a weakened
`no-store` on `sw.js`; and production-hostname drift between `index.html`,
`robots.txt`, `sitemap.xml` and the icon builder.

**All five failure modes were verified by deliberately introducing them.**

### 2.3 The kit's icon builder was CommonJS under `"type": "module"`

**[KIT, a bug in the kit itself]**

`npm run icons` died with **`require is not defined`** as shipped, so no app
ever scaffolded from the kit generated an icon. Fixed by renaming to
`icons/build-icons.cjs` — the extension is what tells node how to parse the
file.

**Status: already fixed** in [`starter-kit/`](./starter-kit/), which carries a
comment saying *"DO NOT RENAME IT BACK"*. Wander's own notes still claim the
kit has the bug; that note is stale. Recorded here so nobody re-fixes it.

### 2.4 The install offer is a pure decision table

**[KIT]**

Four outcomes in priority order: `android-prompt`, `ios-instructions` (with a
**drawn** share glyph — *"the part people cannot find from a text
description"*), `in-app-browser`, `none`. Two things worth knowing: **embedded
browsers (Instagram, Facebook, WhatsApp) cannot install anything — the option
is not in the menu**, so the honest move is to say so rather than show a dead
button; and **iPadOS 13+ reports a desktop Safari user-agent**, detected via
`maxTouchPoints`. The signature list *"WILL go stale, and it is built to fail
safe"* — an unrecognised browser falls through to the ordinary platform
answer.

---

## Part 3 — The store and migrations

### 3.1 Spread defaults **UNDER** stored state, never over it

**[KIT]**

> *"`normalise()` spreads the defaults UNDER the stored state, so changing a
> default only reaches devices that have never saved one. **That is the
> property that makes a default safe to change at all** — if it merged the
> other way, every such change would silently rewrite what people had chosen."*

### 3.2 A new field needs a default even when it needs no version bump

**[KIT]**

**Symptom:** an existing user's content comes back **completely empty** after
an update, with the UI looking perfectly normal.

**Root cause:** a new filter field was added; a save written before that build
had no such field, and the matcher *"would have compared `undefined` against
every place and matched none."*

**Fix:** add it to `defaultState` and rely on 3.1. **The smoke test plants a
save with the field deleted and asserts the content comes back whole.**

### 3.3 Coerce every collection's shape on load

**[KIT]**

*"A save where one of them has the wrong shape — an array where an object is
expected, say, from a hand-edited backup — would throw at the first `in`
check. Coerce rather than trust."*

### 3.4 A save from a **future** version is left alone, not migrated

**[KIT]**

The scenario is real: *"user opened a newer deploy on another device, then an
older cached one here."* The migration returns `null` and the session runs on
defaults **rather than corrupting the newer save.** The smoke test covers
corrupt, missing **and future-shaped** data.

And: **never delete an old migration.** *"Deleting an old migration strands
anyone who has not opened the app since — which, for a local-first app with no
backup, means losing their data permanently."*

### 3.5 Renaming the app renames the storage key, which abandons everyone's data

**[KIT]**

**Fix:** keep a `LEGACY_KEYS` list. Read the old key **only when the current
one is genuinely absent**, so a real save is never overwritten by a stale one;
rewrite under the new name once; and **leave the old key in place** —
*"deleting it buys nothing and removes the only copy if this write fails."*
The importer accepts a backup file that still names the old app.

**The reasoning worth copying**, because it is the general case: *"The app was
never deployed, so in principle nobody holds either — but **'in principle
nobody' is exactly the assumption that loses somebody their saved places**, and
anyone who ran it from a local server does hold one."*

### 3.6 An enum value the UI no longer recognises reads as lost data

**[KIT]**

**Symptom:** records vanish after a section was reorganised.

**Root cause:** *"a booking whose category the planner does not recognise
would render nowhere at all, which looks like lost data."*

**Fix:** translate legacy enum values **once, on load**, not at every render,
with an `|| "<fallback>"` catch-all.

### 3.7 Two controls that answer the same question must clear each other

**[GENERIC]**

**Symptom:** *"'World' plus 'California' deals an empty deck while both
controls look perfectly reasonable, and the person looking at it has no way to
tell that from having swiped the whole catalog."*

**Fix:** the narrower control **replaces** the broader one rather than
stacking inside it, and each UI clears the other when set. Two smoke tests
hold each direction.

### 3.8 Store decisions, never content

**[KIT]**

*"`saved` and `skipped` are maps of id → timestamp; trips point at a
`locationId`. A catalog fix in a later deploy reaches everyone without
touching their data, and a full backup stays a few kilobytes."*

Corollary: **content ids are permanent.** *"Rename a place by changing `name`,
never `id`. Deleting an entry silently drops it from every user's shelf;
prefer fixing it."*

### 3.9 Guard every access; `defaultState` is a function

**[KIT]**

Safari private mode, quota errors and corrupt JSON must never crash the app:
reads fall back, writes silently no-op, `typeof window` guards let the module
import under Node. And `defaultState()` is a **function**, because *"a shared
default gets mutated by the first thing that touches it."*

### 3.10 A shuffle seed must stay a pure function of the seed

**[GENERIC]**

*"`seededOrder(seed)` must keep producing the same order for the same seed, or
a restored backup deals a different deck than the phone it came from. Do not
swap mulberry32 for `Math.random`, and do not sort the catalog files — their
concatenation order is part of the input."*

---

## Part 4 — Gestures and touch

Generic to any swipe or drag UI. The kit's checklist mentions 44px touch
targets and nothing else; this is the rest of it.

### 4.1 No global flag may span an exit animation

**[KIT]**

**Symptom as reported: "I have to swipe twice."** At real usage speed, *"that
is every other gesture."*

**Root cause:** a module-wide `busy` flag held for the whole 320ms exit
flight, and `pointerdown` returned while it held — *"so a swipe begun inside
that window never started — no capture, no drag, no spring back, and nothing
on screen to say why."*

**Fix:** take the decision **immediately** and make the flight cosmetic.
`commit()` calls `decide` and `render` before the element has moved; `render`
sweeps every child **except** one marked `.is-leaving`; the element removes
itself on `transitionend`. **Guard a second decision on the element, never on
the module.**

**Two costs it pays, both of which were real bugs:**

- A leaving element must **drop its `is-top` class as it goes**, or the
  selector matches two elements *"and the buttons can address the one already
  departing."*
- `render` must remove other children **one at a time rather than
  `replaceChildren`**, because *"taking a node out and putting it back cancels
  the transition it is in the middle of and the card vanishes instead of
  flying."*

### 4.2 Commit on distance OR speed, and measure speed over the fastest stretch

**[KIT]**

**Symptom A:** *"the deck felt like work"* — distance-only at 0.38 of the
element width (~148px on a phone) meant a flick did nothing.

**Symptom B:** real flicks silently ignored. **Root cause:** speed measured
first-sample-to-last. *"A thumb leaving the glass rolls back a pixel or two,
so the final sample could point the other way and the direction check vetoed a
flick that had plainly happened; and a gesture that starts slow and
accelerates into the lift averaged itself down against its own beginning."*

**Fix:** take **the fastest pair of samples travelling the same way as the
gesture**, ignore pairs closer together than a minimum unless nothing wider
exists, and **record the release itself as a sample** — *"without it the
lift-off speed is read from wherever the last `pointermove` happened to land."*

**Wander's settled constants**, as a starting point rather than gospel:
`COMMIT_FRACTION 0.18`, `FLICK_VELOCITY 0.30 px/ms`, `FLICK_MIN_DISTANCE 10px`,
`VELOCITY_WINDOW_MS 140`, `MIN_SAMPLE_MS 8`, `TAP_SLOP 8`. The evolution is
instructive: 0.38 → 0.22 → 0.18, and 0.45 → 0.30 px/ms. **Two smoke tests hold
the line in both directions** — a short fast flick must decide, the same
distance crawled must not.

Nice detail: *"the stamp reaches full strength exactly at the threshold, so
'the stamp is solid' and 'letting go will decide' mean the same thing."*

### 4.3 A cancelled gesture is still a gesture

**[KIT]**

**Symptom:** swipes silently do nothing — mostly the ones with a bit of
vertical in them, *"and a real thumb arcs, so the ones it steals are most of
them."*

**Root cause:** with `touch-action: pan-y` the browser can decide mid-gesture
that a swipe was really a scroll and fire `pointercancel`, taking the pointer
away. The handler discarded everything it had measured.

**Fix:** `pointercancel` **commits if the drag had already earned a
decision**, and only springs back otherwise.

### 4.4 A swipeable row inside a scrolling list must lock to one axis

**[KIT]**

**Symptom:** *"a list that resists a thumb going down the screen"* — a bug
*"nobody can describe"*, which is why it is so expensive.

**Fix:** the row is `touch-action: pan-y`, and the handler **locks to one axis
on the first move past a slop threshold** — anything more vertical than
horizontal and it **lets go completely: no capture, no transform, no click
suppression.** Three smoke tests: a mostly-downward drag must not open the
row; the pull reveals the button; the pull does **not** also open the detail
sheet underneath, *"because `click` fires after `pointerup` and a dragged row
would otherwise do both."*

Two details worth carrying: the reveal distance in JS and the button's width
in CSS **are the same number and have to stay that way**; and the revealed
button is kept **out of the tab order and hidden from screen readers while
covered** — *"a tab stop for something nobody can see is worse than not having
it."*

### 4.5 With pointer capture, a tap on a child must be routed by the gesture handler

**[KIT]**

**Symptom:** tapping a thumbnail flips the card instead of opening the viewer.

**Root cause — and both obvious fixes were tried and failed:** *"The card
takes POINTER CAPTURE on pointerdown so a drag that leaves the card still
tracks, and capture retargets every later pointer event to the card — so a
listener on a thumbnail never runs. `click` fires after `pointerup`, by which
time the card has already flipped, so stopping propagation there is too late
as well."*

**Fix:** `pointerdown` remembers its target; the end handler routes a *tap*
that landed on a child to that child's action instead of the parent's. Both
halves tested: the viewer opens, **and** the card does not turn over under it.

### 4.6 The small ones

**[KIT]**

- **Escape closes the topmost overlay only.** *"That was invisible while only
  one could ever be open, and became a bug the moment the viewer could sit on
  top of the place sheet."*
- **A full-bleed overlay needs a reachable dismiss target.** *"A viewer whose
  only exit is a small corner ✕ is one people feel stuck in"* — and if the
  content covers the backdrop completely, the backdrop can never be clicked.
- **Every `:hover` rule stays inside `@media (hover: hover)`.** iOS Safari
  sticks `:hover` to the last-tapped element.
- **Kill iOS's double-tap wait on tappable images**, or the viewer opens on
  the second tap.

---

## Part 5 — Layout

### 5.1 On a flex column, the text must not lose to the media

**[GENERIC]**

**Symptom:** *"a sentence cut off mid-word with no visible scrollbar to
explain it."*

**Root cause:** the text was `flex: 0 1 auto` against a media grid with a
`min-height`, and the grid won.

**Fix:** text `flex: 0 0 auto`; media `flex: 1 1 0` with **no minimum**.

### 5.2 When a block is removed, its space has to go somewhere

**[KIT]**

**Symptom, and this is what users actually reported:** *"the badges floating
up under the copy with the bottom third of the card empty white."* **The
user's report is the layout, not the missing content** — which is why the bug
was mis-triaged.

**Fix:** `margin-top: auto` on the footer.

### 5.3 A new control must fit the geometry that is already computed

**[GENERIC]**

Two failure modes caught while adding one picker: a second toolbar row *"would
push Save and Skip under the tab bar"*, because the deck's height is computed
from what the toolbar leaves; and placing the control **last** in a scrolling
chip row put it *"off the right edge of a 375px phone, which is a filter
nobody finds."*

### 5.4 Centre glyphs optically, not mathematically

**[GENERIC]**

**Symptom:** icons *"read as floating high"* although `align-items` centred
them correctly. *"An emoji glyph carries its visual mass above the baseline
and leaves the descender space empty, so a box that is centred puts a picture
that is not."* Two pixels down — *"measured from the render rather than the
box model, which is the only way this kind of thing can be judged."*

### 5.5 Test at two viewports

**[KIT]**

390×844 at `deviceScaleFactor: 2` **and** 375×667 — *"the short one is where
the `clamp()` height matters."*

---

## Part 6 — Dates

### 6.1 Never `new Date("YYYY-MM-DD")`

**[KIT]**

**Symptom:** off by one day, west of Greenwich.

**Root cause:** *"It parses as UTC midnight and prints in local time, so west
of Greenwich it is the 30th of April."*

**Rule:** *"Every date in this app is a string until the last possible
moment."* Keep `ymd()` and `addDays()` helpers; compare ISO strings
**lexicographically**; export the date arithmetic as pure functions *"so it is
tested without a browser."*

### 6.2 An all-day `DTEND` is the day **after** the last day

**[GENERIC]**

*"It is the most common bug in hand-rolled `.ics` output: write the last day
itself and every exported trip silently loses its final day."* Assert the
exact date, and run the rule backwards on import.

### 6.3 Calendar times are floating — no `Z`, no `TZID`

**[GENERIC]**

*"Someone writing 'lands 14:20' means 14:20 where they land. The app stores no
timezone, so emitting one would be inventing data, and re-basing into the
reader's zone would be wrong on the one field that matters most at an
airport."*

### 6.4 Two `<input type="date">` fields are not a date range

**[GENERIC]**

**Symptom:** the second calendar *"had no idea the first date existed, so it
could neither grey out impossible days nor show you the span."*

**Fix:** one range picker. **Keep hidden `start`/`end` inputs behind it so
existing forms still read their values through `FormData`** — a good general
pattern for replacing a control without touching its consumers. And deal
months lazily with an **"Earlier dates"** control, *"because otherwise a trip
can never be moved earlier than its own start month."*

---

## Part 7 — Test-suite design

### 7.1 A truncated test run must fail (`EXPECTED_CHECKS`)

**[KIT]**

**Symptom:** *"Four stale assertions passed against a run that had already
died at the trips section, and '58/61 passed' reads far too much like a
healthy run."*

**Fix:** a floor at the bottom of the suite that fails the run if fewer checks
executed than expected. *"That nearly shipped a broken planner."* It **earned
itself immediately** — the very next commit caught a run that died at the date
picker and reported "69/72 passed."

### 7.2 Every assertion must be able to fail

**[KIT]**

The house rule, restated because Wander kept finding new ways to break it. The
original case: an assertion that the tab bar's bottom edge equalled the
viewport height, *"which, for a `position: fixed; bottom: 0` element, is true
by construction whatever else is broken."*

> **An assertion that cannot fail is worse than no assertion, because it buys
> confidence it has not earned.**

**Verify a check by deliberately breaking the thing it guards.** Done for all
five deploy-check failure modes, for the flick/crawl pair, and for the
resized-URL fallback.

### 7.3 A stub written from the same reasoning as the code cannot falsify it

**[KIT]**

See [P5](#p5-a-stub-written-from-the-same-reasoning-as-the-code-cannot-falsify-it).
The most expensive lesson in the repo.

Two consequences for how you write the stub:

- **The stub is part of the test's meaning, not scaffolding.** Wander's
  *"deliberately serves junk — flags, locator maps, an edit icon, a banner, a
  poster, a portrait, a file with no rendered thumbnail — so the filter and
  the ranking have something real to reject."* Every named fixture is a case:
  one 404s, one is too small, one is slow, one refuses the first six requests.
  *"Adding a behaviour usually means adding a name here first."*
- **Make the stub fail the happy path deliberately.** The image route *refuses
  exactly one width and serves every other*, so the fallback is **exercised
  rather than assumed** — *"removing it turns two checks red."*

**And a corollary worth its own line: a test that passes for the wrong reason
is worse than no test.** When the reproduction for attempt 12 was written,
*"the first attempt at the stub PASSED, which was itself informative"* — a
different fallback was rescuing both cases before the buggy path was ever
reached. The stub had to be made to fail *that* too before the bug was
reachable at all. **If a new test goes green first try, find out why before
you believe it.**

### 7.4 Assert the promise, not the mechanism

**[KIT]**

**Symptom:** three smoke tests went **red against data that was working
correctly**, after an optimisation changed how the app achieved the same
result. They had asserted a lookup being written to the device, a gallery of
exactly six, and a record count growing — all mechanisms, none promises.

### 7.5 Do not repeat numbers the code already owns

**[KIT]**

**Symptom:** *"a test whose only fix is to edit the literal — which is how a
suite trains people to edit numbers rather than read failures."*

**Fix:** import the constant from wherever owns it. What the test checks
instead is *"that the app's view matches the record."*

### 7.6 Wait for a state, never sleep

**[KIT]**

**Symptom:** an intermittent that passed four runs in five.

**Two separate causes**, and the second is subtle: sleeping rather than
waiting for a lazily-rendered element; and a finish condition that **is also
the resting state** — *"the readout back to 'N photos saved' is also the
resting state before the click, so it could match the old text before the
handler had written anything."* **Fix:** wait for the button to say *Stop*,
*then* wait for it to stop saying it.

### 7.7 Tests must not couple to each other through shared state

**[KIT]**

*"The explore assertions hard-coded a saved-places count that a new gesture
test changed."* And a threshold *"broke as soon as a test above it dealt more
cards and left less headroom."*

### 7.8 Do not assert things that measure the stub

**[KIT]**

*"The stub serves a small pool of image files, so many places legitimately
resolve to the same URL, and asserting tightly on unique cached files was
measuring the stub rather than the app."*

### 7.9 Name the environment traps in the testing docs

**[KIT]**

Chromium is pre-installed at `/opt/pw-browsers/chromium` in the agent sandbox
— **do not run `playwright install` there.** But **a laptop needs `npx
playwright install chromium` once**, or the suite dies at `browserType.launch`
and prints **`0/2 passed`**, *"which looks far more alarming than it is."*
That exact confusion cost a real session.

---

## Part 8 — Talking to anything over a network

Wander's specifics are about Wikimedia. **Read this section as being about
Google, Apple and Stripe**, because every kernel transfers and
[`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md) now puts three network dependencies
into every app.

### 8.1 A 404 inside an `<img>` is completely silent

**[WONDER / generic kernel]**

**Symptom:** *"the lookup succeeded, the URL looks perfect, the card shows a
glyph."* Found on a real phone.

**Root cause:** the code rewrote a width in a thumbnail URL unconditionally,
and the service **refuses to upscale and answers 404.**

**Generic kernel:** *a resource that fails to load in an `<img>` produces no
error anywhere.* Every URL you construct needs a fallback to one that
something has already successfully loaded.

### 8.2 A derived or resized URL always needs a fallback chain

**[WONDER / generic kernel]**

**Symptom, reported from a phone:** *"some load, many don't"* — and four
screenshots split **exactly two and two**.

**Root cause:** the app rewrote `1920px-` to `1400px-`, and **that narrower
copy is a width nobody has ever fetched**, whereas the stored URL had been
downloaded before it was written down. Worse, the retry read the original out
of a per-device lookup cache **which a baked entry has no record in** — so a
failed resize went straight to a placeholder *"with a known-good URL sitting
unused in the catalog."* The two that worked had no width in the path to
rewrite at all.

**Fix:** try, in order, **the resized URL → the stored URL exactly as baked →
an unresized file from a live lookup.** And: *"`raw` is the ORIGINAL file, and
must differ from `lead`. Storing the same thumbnail URL twice makes the second
attempt fail exactly as the first did."*

**Deriving a URL is a bet, not a fact.** Mark derived URLs as derived and keep
them out of the one slot that matters most, *"because being wrong there costs
the one picture a card gets."*

### 8.3 Every request needs a deadline, and the deadline must be generous

**[WONDER / generic kernel]**

**Symptom:** *"a phone on a weak signal does not fail, it HANGS, and a pending
promise is invisible: no error, no retry, nothing in any console, just a grey
box forever."*

**Fix:** abort after **20 seconds**. **Nine was tried first and was wrong** —
*"on a phone with one bar a search legitimately takes longer, and aborting it
turned 'slow' into 'no picture at all'. A deadline exists to stop a hang, not
to decide what counts as slow."* The BUGLOG notes this honestly as
self-inflicted: *"attempt 3 introduced the deadline that attempt 5 had to
relax."*

**Layered watchdogs must be ordered.** The `<img>` watchdog (elements have no
timeout of their own) **must stay longer than the fetch deadline** — *"at
twelve seconds it deleted photographs that were still on their way."*

### 8.4 A failed lookup is not a verdict about the thing

**[WONDER / generic kernel, three times over]**

**Symptom:** stuck on a placeholder until relaunch, or forever.

**Three versions of one bug:** (1) a `failedThisSession` set wrote a place off
after **one** error — *"a train tunnel blanked it until relaunch"*; (2)
catching an error made *"we could not look"* indistinguishable from *"we
looked and there is nothing"*; (3) that empty answer was **persisted to
localStorage**, where it survived relaunches.

**Fix:** three attempts per item; **offline is not counted as an attempt**;
nothing is written down unless something actually answered; failure counts
clear on the `online` event; and an item showing a placeholder **re-resolves
itself when the signal comes back.**

**This is the shape of the cached-entitlement rule** in
[`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md): "could not reach the server" and
"has not paid" arrive looking identical, and persisting the second when you
meant the first is a paying customer permanently downgraded.

### 8.5 An empty answer is never written to the device

**[WONDER / generic kernel]**

> *"'We looked and there is no photograph' is a real answer and the app should
> stop asking — but persisting it turns one odd answer into a card that is
> blank forever, on a phone whose owner cannot clear it and has no reason to
> guess that they should. A genuinely photo-less place is RARE; a weird answer
> is not — a title that lands on a disambiguation page, a category that
> briefly returns nothing, an endpoint having a bad minute."*

**Fix:** empties live in a session-scoped set and nowhere else; a **stored**
empty reads as *unknown*, not *none*; superseded cache keys are cleared. *"Two
shipped builds wrote empties. A device carrying one would never have seen any
of the fixes."*

**And clear superseded keys on import, not on first cache read.** The cleanup
lived inside `load()`, *"which only runs when something asks the cache a
question — and once the catalog was baked, almost nothing does."* **A cleanup
guarded behind a code path that an optimisation removed.** Why it matters
beyond tidiness: *"that storage is what gets reclaimed under quota pressure,
and what gets evicted to make room is the photographs that worked."*

### 8.6 One flag per question

**[WONDER / generic kernel]**

**Symptom:** one card shows exactly **one** photo; every other shows **none**.
Forever, across relaunches.

**Root cause:** one flag meant two different things — *"the widening search
has been cast"* and *"there is nothing more to find"* — so the resolver
returned **before** the strong lookup ever ran. The pool froze at whatever the
weak search returned, **and the flag is persisted**, so it froze on every
future launch.

**The trap inside the fix, which the first cut walked into:** *"persisting
either flag after a search that found nothing writes down a verdict, and the
collector swallows a failed tier and returns an empty list — so a phone in a
tunnel looks exactly like a place the service genuinely has nothing for."*
Flags reach the device **only when the search actually gained something.**

### 8.7 Classify a failure by cause, not by symptom

**[GENERIC]**

**Symptom:** a full batch run baked **12 of 1,889** entries and reported the
other 1,877 as **"no network"**. *"It was not the network. It was rate."*

**Root cause:** four lookups in flight with no pacing across ~15,000 requests
is a burst the service is entitled to refuse with **429** — *"and `getJSON`
throws on any non-ok status, so a throttled request reaches the reporting code
looking exactly like a dead socket, and the report then told someone with a
working connection to go and check their connection."*

**Fixes, all worth copying into any batch script:**

- One global queue (2 concurrent, 200ms apart), exponential backoff with
  jitter on 429/503, honouring `Retry-After` — and **a 429 quiets every
  worker, not just the one that got it.**
- **Results written as they are found**, so an abandoned run keeps its
  progress and a re-run resumes.
- **An unbroken run of network-shaped misses with nothing succeeding stops the
  run**, instead of grinding through five retries × 1,889 entries to learn the
  same thing.
- **Keep the HTTP status or error name** in the failure record
  (`none-loaded:404x6` vs `none-loaded:timeoutx6`). A bare `catch {}` and an
  `if (res.ok)` with no `else` *"reported the symptom for every cause it
  has."* And *"a photograph that answers with an HTTP status reached a
  server."*
- **Review the output as a contact sheet.** One HTML page of every choice —
  *"sixteen hundred choices become a couple of minutes of scrolling. The
  alternative is what actually happened: finding them one at a time, weeks
  apart, by swiping a deck."*

**A flag-parsing bug found while testing this**, which is its own lesson: an
options parser read `args[0]` when a flag was absent, so `--dry-run` on its own
*"filtered the file list down to nothing and exited in a tenth of a second
reporting no misses"* — **a run that silently did nothing and reported
success.**

### 8.8 Fire independent lookups in parallel

**[WONDER / generic kernel]**

**Symptom:** nothing loads at all on hotel wifi.

**Root cause:** awaiting one lookup before deciding whether to make the other
produced **up to five sequential round trips per card**. *"Five round trips on
hotel wifi is not a slow photo, it is no photo."*

**Fix:** both go out in the same tick. **The smoke test holds one request for
400ms and fails if the other waits behind it** — a neat and reusable way to
test parallelism.

### 8.9 The small print

**[WONDER / generic kernel]**

- **Two APIs from the same vendor can have different CORS rules.** *"The
  Action API needs `origin=*`; the REST API does not. `/w/api.php` sends no
  CORS header unless the request asks for it, so omitting it fails every
  gallery fetch from a browser with an error that explains nothing."* Comment
  it at the call site.
- **"The source answered" is not "the source has what this UI needs."** Gating
  on a top result's *score* and then choosing by *width* asks two different
  questions: *"a category holding one well-regarded 900px photograph passed
  the first, failed the second, and stretched it across the card."*
- **Ask for the size you will actually draw.** *"Photos look blurry"* had two
  causes and both were in the numbers: a flat requested width of `1000`
  commented *"a 390px card at 3×"* — **which is 1170**; and a usability floor
  of 400px, *"which is the width at which something stops being an ICON, not
  the width at which it starts being a photograph worth showing full-bleed."*
  **The smoke test measures the rendered element and fails if the fetch is
  narrower than the draw.** Conversely, ask for a *small* copy where the frame
  is small.
- **If a data source needs an API key, it does not go in a client-side app.**
  *"A key in a client-side app with no server is public in the bundle, comes
  with a rate limit a thousand places will strain, and hands a third party a
  view of who is looking at what."* Decided deliberately, not by omission.
  *(This is exactly why the accounts service exists — see
  [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md). Stripe's secret key is the same
  problem with a bill attached.)*
- **Read the field the vendor actually uses.** Curation arrived in
  `Assessments`, not `Categories`, because the vendor files it in a *hidden*
  category and the metadata extension strips hidden categories out. Reading
  the obvious field meant *"every photograph scores alike, the ranking
  collapses back to filename relevance, and nothing anywhere says so."* Still
  unverified against the real API — logged under Waiting on a human, per P5.
- **Record the option you rejected and why.** A `deepcategory:` tier was left
  out deliberately: *"it is a vendor-specific keyword this sandbox cannot test
  against, and shipping an unverifiable query into the path that already
  handles the hard cases is how the last bug got in."*

---

## Part 9 — A shipped content catalog

Generic to any app with a large shipped dataset — Popcorn and Animas both
qualify.

- **A validator that runs first in `npm test`**, owning a **PLAN** (per-file
  counts, types, groups) plus per-entry checks: required fields, controlled
  vocabulary, copy length, uniqueness, and a cross-check of any baked URL's
  host against `_headers`.
- **Check uniqueness on every axis, or the gap is exactly one re-typed id.**
  The validator compared names *across* files and ids *within* a file, *"which
  left a gap exactly the width of a re-typed id"* — and six duplicates shipped
  in one afternoon. *"A deck that deals the same museum twice looks like a
  bug, and it is one."* When you delete a duplicate, **keep the original**:
  its id is what saves and trips point at.
- **Exact `count` for finished files, `min` for growing ones.** A finished
  file's count changing *"means somebody added or dropped an entry without
  saying so, and the build should say."* An exact count on a growing file
  *"is how a plan stops being read."* Likewise, don't apply a balance check to
  a file mid-batch: *"failing on that would mean no batch could ever be
  committed on its own."*
- **Cap prose in the unit the writer thinks in.** A spec of "exactly four
  sentences with a character range" produced *"a median of 98 words — a
  paragraph, on a card someone flicks through at speed."* Now fifty words:
  *"a word count is what a person writing to the limit can hold in their
  head."*
- **A filter dimension with no floor exposes holes the old UI hid.** *"Filter
  the deck to any of them and it deals two cards and stops, which reads as a
  broken app rather than a small state."* Enforce a minimum per bucket in the
  test *"so it cannot quietly return."*
- **A generated field makes field order load-bearing.** The baker finds
  `id: "<id>"` and rewrites the next `imgs: [...]`, so `id` must come first —
  *"the validator does not check the order and the baker depends on it."* An
  honestly-recorded unguarded invariant; the lesson is *either check it or you
  will trip on it.*
- **A blanket find-and-replace on a rename will corrupt your content.**
  Renaming Wonder → Wander: *"'Wonder' and 'wonders' appear fourteen times in
  place descriptions as ordinary English, and a blanket replace would have
  quietly corrupted the prose of a thousand entries."*

**The governing principle for any auto-selected third-party content**, which
transfers wholesale:

> **A WRONG PHOTOGRAPH IS WORSE THAN NO PHOTOGRAPH.** *"A glyph says 'no
> picture yet' and a person reads past it; a confident photograph of the wrong
> thing says 'this is what it looks like', and it does not cost one card, it
> costs the credibility of every other card in the deck."*

Three real failures, three different classes, all photographed on a phone:

| What appeared | On the card for | Failure class |
|---|---|---|
| A military helicopter winching a man off a flooded roof | Georgia Peach Festival | **Wrong subject entirely** |
| A caravan beside a tent | Amicalola Falls | **Right place, wrong thing in it** |
| One ordinary house behind a picket fence | Savannah Historic District | **Right subject, unrepresentative frame** |

*"Every one of those files passed every quality test the app applied: wide,
sharp, landscape, recent, not a poster. The pipeline had no way to ask the only
question that mattered — is this a picture of the thing?"*

And the hardest-won of them: **relevance ranking is not quality ranking.**
*"Commons ranks by how well the FILENAME matches, which is exactly why a
poster called 'Eiffel Tower' outranked a photograph of it."* The resolution
was to let the human editor's choice win unless a human reviewer had marked
the alternative — *"correct-and-dull beats striking-and-wrong."*

### One more, and it is a good one

**Unanchored words in a reject list silently eat your own data** — [GENERIC]

**Symptom:** six places in the catalog could never show a photograph, with
nothing anywhere saying why.

**Root cause:** the reject regexes had **no word boundaries**. `icon` matched
Fort Tic**icon**deroga. `arrow` matched N**arrow** Gauge. `star` matched
**Star**ved Rock and **Star**i Most. `crystal` matched Crystal Bridges.
`sound` matched Milford Sound.

**A second round of the same bug** followed, where `star` was still rejecting
the Nebraska *Star Party*.

**Fix, and the rule:** **run the reject filter over your entire real dataset
in the test suite, and fail if any legitimate entry is rejected.** Wander's
smoke test runs its filter over all 1,000 catalog names. A guard test holds
**both halves** — the icons still drop, the party stays.

---

## Appendix — the thirteen attempts

The shape of a case that would not close. Twelve reasoned from the code, one
found from a real response.

| # | Hypothesis | Outcome |
|---|---|---|
| 1 | Thumbnail wider than source → silent 404 | SHIPPED, UNVERIFIED. *"A genuine bug, definitely fixed. Did not end the reports."* |
| 2 | Article lead images are artwork | SHIPPED, UNVERIFIED. **Found a second bug while doing it**: the unanchored reject regexes |
| 3 | Three sequential searches at flip time, no timeouts | SHIPPED, UNVERIFIED. *A new symptom was reported after this* |
| 4 | Photos smaller than the card draws | SHIPPED, UNVERIFIED |
| 5 | The 9s deadline from attempt 3 was too aggressive | SHIPPED, UNVERIFIED. **"This was partly self-inflicted"** |
| 6 | Sequential lookups; curation read from the wrong field | SHIPPED, UNVERIFIED. *"The `Assessments` claim has never met the real API"* |
| 7 | Empty answers persisted to localStorage | SHIPPED, UNVERIFIED |
| 8 | The card back was never warmed | SHIPPED, UNVERIFIED |
| 9 | **The device was running old code** (evidence, not hypothesis) | **RULED IN as a confounder** for at least one report |
| 10 | `incategory:` needs the category's exact name | SHIPPED, UNVERIFIED |
| 11 | *(not a fix — an instrument)* make the failure say what happened | SHIPPED |
| 12 | One flag answering two questions, persisted | **FIXED AND HELD BY A TEST** — first with a reproduction; *still not a confirmation* |
| 13 | **The API's own hostname is not on the CSP allow-list** | SHIPPED, UNVERIFIED. *"The first entry found from EVIDENCE rather than from reasoning"* |

> Twelve attempts, all reasoned, none confirmed — and the one found from a real
> API response took ten seconds to understand.

That ratio is the entire argument for
[P5](#p5-a-stub-written-from-the-same-reasoning-as-the-code-cannot-falsify-it)
and [P4](#p4-two-lists-and-enforce-the-boundary): get the real-world check onto
a human's list **early**, because until someone runs it you are not debugging,
you are speculating in public.

---

## Where the source material lives

Wander's own files, worth reading directly when one of these bites:

| File | Why |
|---|---|
| `docs/BUGLOG.md` | The format, the outcome vocabulary, and the two standing sections |
| `docs/PHOTOS.md` | The three ways auto-selected content goes wrong |
| `CLAUDE.md` | "Read this much, then start", "Where do I change X?", grouped invariants, the dated status section |
| `scripts/check-deploy.mjs` | Five failure modes invisible in local development |
| `scripts/check-docs.mjs` | Link, anchor and file-map resolution across all docs |
| `_headers` | The `connect-src`-vs-`img-src` paragraph; `no-store` on `sw.js`; the `max-age` reasoning |
| `js/store.js` | Guarded accessors, defaults-under-stored, future-version handling, legacy keys |
| `test/smoke.mjs` | The `EXPECTED_CHECKS` floor, the production-headers server, the named-case stub |
| `DEPLOY.md` | Runbook format: every setting, the CNAME, three curl checks, and the traps |
