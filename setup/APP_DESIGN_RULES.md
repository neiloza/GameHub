# House rules for building Neil's apps

Derived by reading five shipped apps end to end: **Liberty**, **Forest**,
**SlotMachine** (Lucky Gold Slots), **Popcorn**, and **Clash of History**.

Part 1 is the rule set: almost all of it is a rule because *all five* apps
already do it, plus two additions made by decision and marked as such. Part 2
is the starter kit that makes following Part 1 nearly free. Part 3 is the
review queue — the things **3–4 of the 5** apps do — with what was decided
about each and what is still open.

The shape being described is consistent enough to name: **an installable,
offline-capable, phone-first web app, with no tracking, that lives on its own
subdomain of one shared apex domain and stores the user's data on the user's
device.** Every one of the five is a variation on that; the differences are
stack, not philosophy.

> **Amended 2026-09-21.** That sentence used to read "no tracking and no
> monetisation", because none of the five apps had any. Apps now ship **Google
> and Apple sign-in and a one-time $5 unlock**, served by one shared backend.
> Rule 7 below is rewritten accordingly; *no tracking, no ads, no dark
> patterns* is unchanged and the free version stays complete.
> [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md) is the whole design.

## The rest of `setup/`

| File | What it is for |
|---|---|
| **This file** | The rules. What every app does and why |
| [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md) | Accounts, payments, the API, the database, the hosting, every credential |
| [`LESSONS.md`](./LESSONS.md) | Bugs already found and paid for, by symptom. **Read before debugging anything** |
| [`starter-kit/`](./starter-kit/) | A working PWA that already obeys Part 1 |
| [`UPGRADE_PLAN.md`](./UPGRADE_PLAN.md) | Historical: bringing the pre-existing apps up to this standard |

---

## Part 1 — The rules

Rules 1–11 and 13 are rules because *all five* apps already do them. Rules 10b
and 12 were added by decision on 2026-08-20 — they are marked as such, and
they are the only two that are not simply a description of what you already
build.

### 1. It is a PWA, and installability is a feature, not a checkbox

Every app ships a web app manifest with `display: standalone` and
`orientation: portrait`, a full icon set, and the Apple meta tags that the
manifest does not cover.

**Required in every `<head>`:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#RRGGBB" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="ShortName" />
```

**Required in every manifest:** `name`, `short_name`, `description`,
`start_url`, `scope`, `display: standalone`, `orientation: portrait`,
`background_color`, `theme_color`, `categories`, and icons at **192 and 512
PNG plus a maskable copy**.

Liberty's `manifest.ts` states the reason plainly and it is the house
position: the 192 and 512 PNGs are not decoration — Chrome's installability
criteria require them and an SVG does not satisfy them, and without a
`maskable` copy Android letterboxes the mark onto a white tile next to every
other app on the phone.

> **Rule:** never ship an icon set by hand. Generate it from one SVG source
> (see §2 of Part 2). Icons are opaque, full-bleed RGB PNGs — no alpha, no
> ground band, no hand-edited PNGs.

### 2. Phone-first geometry: `dvh`, `viewport-fit=cover`, and safe areas

All five use `100dvh` and `env(safe-area-inset-*)`. This is the single most
consistent technical signature across the codebases, and Forest's stylesheet
carries a ~25-line comment about the one time it went wrong.

The rules that fell out of that:

- The page paints **under** the status bar and home indicator
  (`viewport-fit=cover`). Reserve the strips with `env(safe-area-inset-*)`,
  never with a hard-coded number.
- Put the inset behind a variable (`--safe-b: env(safe-area-inset-bottom, 0px)`)
  so every bottom-anchored element derives from **one** number, and so you can
  fake a notch in a desktop browser while testing.
- Use `min-height: 100dvh`, not `100vh`.
- The authoritative background belongs on `html` (or a dedicated
  `position: fixed` overshooting `#bg-fill` element), never on `body` alone —
  the safe-area strips paint from the root element, and a background on `body`
  leaves a visible band at the top on iOS.
- `html { overflow-x: hidden }` on the **document**, not just body: one
  overflowing child otherwise drags the whole page sideways and takes the
  fixed bottom nav with it, which reads as the navigation breaking.
- Touch targets are **≥44px**. Liberty spells out the reason in `ui.tsx`:
  *"thumbs, not cursors."*

### 3. One shell, everywhere: topbar → views → bottom tab bar

Four of the five vanilla/React apps use literally the same class names, and
the fifth (Liberty) uses the same structure under Tailwind. Reuse the
vocabulary rather than inventing new names:

| Element | Class | Notes |
|---|---|---|
| Fixed header | `.topbar` | Brand mark left, actions right |
| Bottom nav | `.tabbar` > `.tabbar-inner` > `.tab` | `.tab-icon` + `.tab-label` inside each |
| A screen | `.view` (or `.screen`) | Exactly one carries `.active` |
| Modal | `.overlay` + `.sheet` | Bottom sheet, backdrop, close button, Esc to dismiss |
| Small buttons | `.btn`, `.btn-primary`, `.icon-btn`, `.ghost-btn` | |
| Pills / filters | `.chip` | |
| Surfaces | `.card`, `.panel` | |
| Nothing-here state | `.empty-state` + `.empty-title` + `.empty-sub` | |
| Transient message | `.toast` | |

Naming is flat kebab-case with a component prefix (`detail-sheet`,
`seed-toolbar`, `db-tile-name`) — prefix-noun-modifier, **not** BEM, no CSS
modules, no utility framework outside Liberty. Tab switching is driven by a
`data-view` attribute on the button, resolved to `#view-<name>`.

### 4. Colour lives in `:root` as named tokens, and the palette is small

Every app defines its entire palette as CSS custom properties at the top of
its stylesheet, with a comment naming the *concept*: "classic popcorn box —
cinema red, warm white, butter & popcorn yellow"; "calm, minimalist focus app
… soft, low-contrast palette"; Liberty's "five colours: black, white, silver,
gold, parchment. Nothing else carries brand weight."

The rules:

- **Name tokens by role, not by hue** where the role can outlive the colour.
  Liberty's `--accent` is "the ink you press" — near-black on white, silver on
  black — and the comment notes the token *used to* be named after a colour
  and the name outlived it.
- Keep a **tight core** (roughly 5–8 brand-weight colours) and use anything
  beyond that semantically only. Red and green mean yes/no, never brand.
- Always define: surface ramp (`--bg`/`--paper`, raised, sunken), ink ramp
  (`--ink`, `--ink-soft`, `--ink-faint`), `--line`/`--line-strong`, one accent,
  `--radius`, and a shadow scale.
- **Write down why a colour exists** when it is non-obvious. Liberty's
  parchment token carries a paragraph about the narrow band of warmth it has
  to live in; that comment is the reason the next session does not retune it
  into a highlighter.

Multi-theme is done with `[data-theme="..."]` blocks that redefine the same
token names (SlotMachine ships five: vegas, cozy, neon, forest, red-carpet),
with the theme applied by an inline `<script>` in `<head>` **before first
paint** so there is no flash.

### 5. The user's data is theirs, on their device

Namespaced, versioned `localStorage` key: `popcorn:v1`, `luckyGoldSlots:v1`.
Bump the version and add a migration when the shape changes incompatibly —
Forest carries live migrations for five prior versions of its store.

Every read and write is wrapped: guard for no `window` (SSR), `try/catch`
around access, reads fall back to a default, writes silently no-op. Clash's
`storage.ts` explains it: a disabled store (private mode), a quota error, or
corrupt data must never be able to crash the app.

**Two additions, 2026-08-20.** Neither existed in any of the five apps.

- **Call `navigator.storage.persist()` at boot.** It asks the browser not to
  evict the origin under storage pressure. Chrome usually grants it to an
  installed PWA unasked, but usually is not a guarantee.
- **Ship export and import.** This is the one that matters. Installing helps
  on iOS, where a PWA gets its own container that survives clearing Safari's
  history and is exempt from the 7-day eviction rule. It helps much less on
  Android, where an installed PWA shares origin storage with Chrome and
  "clear cookies and site data" takes it. And neither survives a lost phone or
  a new device. `persist()` is a floor; a downloadable backup is the safety
  net, and the floor is not a reason to skip the net.

**Amended 2026-09-22 — cloud save.** The previous amendment said the server
holds no app content. That is no longer true: a signed-in account's data for
every app is mirrored into Postgres, so it survives a lost phone and appears
on a second device. The full design is in
[`accounts/SYNC.md`](./accounts/SYNC.md).

**The rule survives, with one word changed. The device is still the source of
truth; the server is a MIRROR of it.** That distinction is the whole rule, not
a technicality:

- **Most people never sign in.** Their data must work exactly as well as a
  signed-in user's, forever, with no account and no server.
- **A service outage costs nobody anything but sync.** An app that will not
  deal a deck on a plane because an API is unreachable has thrown away the
  reason it was built offline-first.
- **The test of whether this is still honoured:** deleting `js/sync.js` must
  leave a working app. If it does not, the mirror has quietly become the
  original.

Three things that follow, all of which are easy to get wrong:

- **Never last-write-wins.** Two devices editing offline is Tuesday, not an
  edge case. Every write declares the revision it was based on, and a stale
  write is refused so the client can merge. The default merge is a **union**
  of id-keyed maps — which works only because this rule already says *store
  decisions, never content*, so the data is shaped to merge safely.
- **Export is still the safety net**, and still never behind the paywall.
  Sync protects against a lost phone; it does not protect against a mistake
  that syncs.
- **The privacy posture changed and must be stated.** The server now holds
  what people did, not just who they are. Account deletion deletes something
  real. There is still no analytics and no third-party anything — storing what
  somebody asked you to store is not surveillance, and the line is that this
  data exists to be given back to them and for nothing else. Say so in
  Settings.

### 6. Works offline, updates itself

Service worker, network-first for same-origin GETs, falling back to cache,
falling back to `index.html`. `skipWaiting()` + `clients.claim()` so a bad
worker can be replaced by the next deploy instead of waiting for every tab in
the world to close. Bump `CACHE` on deploy; the `activate` handler deletes
every other cache.

Two standing exceptions worth copying:

- **Do not precache large assets.** Popcorn deliberately leaves its ~11MB
  lookup tier out of the shell; Forest leaves ~15MB of music out. The fetch
  handler caches them on first real use anyway. Precaching them would make
  every install pay for them.
- **A reading app may cache almost nothing.** Liberty's worker caches exactly
  one file and says so: *"that restraint is the design rather than laziness"* —
  a shell-caching worker will eventually pin someone to a stale build, and
  Liberty's whole value is that the bill in front of you is the current one.

### 7. No tracking, no ads, no dark patterns — and one honest price

Zero analytics, tag managers, session recorders or error-reporting SaaS in any
of the five. The only third-party origins any app touched were
`fonts.googleapis.com`/`fonts.gstatic.com` and, in Popcorn, TMDB attribution.

This is a product stance as much as a technical one, and it shows in the
copy: SlotMachine's own meta description is *"a healthier alternative to
predatory slot games — no microtransactions, no manipulation."* Forest is an
anti-screen-time app. Liberty is civic infrastructure. Build accordingly.

**Rewritten 2026-09-21, when apps gained accounts and a price.** The stance is
unchanged; what it now has to survive is a payment. The full design is in
[`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md); the rules that belong *here*,
because they govern what every app is allowed to be:

- **No analytics, ads, tag managers or error-reporting SaaS.** Adding Stripe
  does not open the door to Segment.
- **One price, paid once, per app: $5.** No subscriptions, no tiers, no
  consumables, no in-app currency. A local-first app that does no server work
  has no recurring cost to pass on, and charging rent for it is the thing this
  house does not do.
- **The free version is complete and recommendable.** The test: would you
  recommend it to a friend without apologising for it? A free tier whose job
  is to be annoying is not a product, it is a ransom.
- **Export is never gated.** Rule 5 says the user's data is theirs. A paywall
  between a person and their own data is precisely the dark pattern the rest
  of this rule forbids, and it is the one a reasonable session gets wrong.
- **No account required to use the free version.** The app opens and works.
  An account exists to carry a *purchase* between devices, not to gate the
  product — no sign-in wall on first launch, ever.
- **Nothing that shipped free is ever taken back.**
- **The third-party scripts load on tap, never in `<head>`.** Google, Apple
  and Stripe are *functional* third parties, invoked deliberately by someone
  tapping "Sign in" or "Buy" — not *surveillance* third parties watching
  someone who did not ask for them. A free user who never signs in must make
  **zero** third-party requests. That property is the whole distinction, and
  pasting a vendor's copy-paste snippet into the shell loses it silently.

Each app's `CLAUDE.md` carries one line under Invariants recording where its
own free/paid line sits and why. "What is free" is exactly the kind of
decision a future session re-derives differently and sensibly — and a
sequence of sensible local decisions is how a product ends up with a
subscription nobody chose.

### 8. Dependencies are close to zero, and the test runner is `node --test`

- The three static apps (Forest, Popcorn, SlotMachine) have **no
  `package.json` at all**: no build step, no framework, no bundler. Plain
  HTML/CSS/JS served as files.
- The two TypeScript apps are still lean: Liberty ships 8 runtime deps
  (Next, React, Drizzle, postgres, zod, cuid2), Clash ships 4 (React,
  react-dom, pixi.js, workspace shared).
- Where there are tests, they run on **Node's built-in test runner** — Liberty
  via `node --import tsx --test`, Clash via `node --test
  --experimental-strip-types`. No Jest, no Vitest, no Playwright in
  `devDependencies`.
- Where a build-time tool is needed (Popcorn's TMDB fetcher, Forest's icon
  builder) it is plain Node in `scripts/`, dependency-free, and never ships to
  the browser.

> **Corollary rule:** if a new app does not need a server or a database, it
> gets no *runtime* dependencies and no build step. Reach for Next.js only
> when there is a real backend (Liberty: Postgres + ingestion) and Vite+React
> only when there is real client state to manage (Clash: a game engine).

**The shared backend is the one exception, 2026-09-21.** Accounts and payments
need a server, so there is exactly one — `api.thewizardofoza.com` — shared by
every app, and it is where the estate's dependencies are allowed to live
(Stripe, a Google token verifier, a JWKS library, a Postgres driver, nothing
else). **The apps themselves are unchanged:** still static, still zero runtime
dependencies, still no build step. They call one origin with `fetch()`. That
the server exists is not a licence to put one inside an app.

**Refined 2026-08-20.** The original form of this rule was "no `package.json`
at all", which is what the three static apps do. That was tightened after it
collided with the test decision below: a `package.json` carrying *only*
`devDependencies` adds no runtime dependency, ships nothing to the browser,
and introduces no build step — and it pins the test runner and the icon
builder instead of leaving them to an ad-hoc `npm i -D` that silently stops
working a year later (Forest's `build-icons.js` has exactly that problem
today). The rule is therefore **no runtime dependencies**, not no manifest.

### 9. Pure functions at the edges, so the fiddly bits are testable

The clearest recurring architectural move. Liberty's `installPrompt.ts` says
it outright: platform detection across iOS, iPadOS, Android and half a dozen
embedded browsers *"is fiddly and impossible to check by hand — as a table it
is a unit test that runs in milliseconds."*

So: take a snapshot of the messy world (`{userAgent, isStandalone,
hasNativePrompt, maxTouchPoints, installed}`), pass it to a pure function,
get back an enum. Keep the DOM wiring in a separate layer. Popcorn's
`install.js` reimplements exactly the same table in vanilla JS. Same idea in
Liberty's `domain.ts`, `districts.ts`, `recurrence.ts`, and Clash's whole
`packages/shared` rules engine.

Where behaviour has to fail safe, say so in the code: the in-app-browser list
*"will go stale, and it is built to fail safe: an unrecognised embedded
browser falls through to the ordinary platform answer, so the worst case is a
less helpful message rather than a broken one."*

### 10. Comments explain *why*, and they are allowed to be long

This is the strongest stylistic signature in the whole set, and it is
non-negotiable house style. Comments in these repos are not restatements of
the code — they are the record of what was tried, what broke, and what must
not be undone. Examples that would be deleted by most style guides and should
not be here:

- 25 lines on why the Forest background lives on a fixed overshooting element
  rather than `background-attachment: fixed` (pixel-sampled from a real iOS
  screenshot).
- A paragraph on why Liberty's service worker caches one file.
- A paragraph on why Popcorn hides every `:hover` rule behind a media query
  (Safari sticks `:hover` to the last-tapped element, so the *next* card
  rendered into that slot inherited the highlight).
- Four numbered rules a new Forest sound effect has to keep, with the dBFS
  levels each was measured at.

Rule of thumb: **if a future session could plausibly "clean this up" and
reintroduce a bug, write the paragraph.**

### 10b. The accessibility floor — settled 2026-08-20

Promoted from the review queue. Three things every app gets:

- **`prefers-reduced-motion`.** The house pattern is Forest's inverted form —
  put animation inside `@media (prefers-reduced-motion: no-preference)` so
  motion is opt-in. The kit ships the blanket kill-switch instead, because
  that is the form that retrofits safely onto code that already animates.
- **`:focus-visible`.** Liberty's version: a 2px outline with
  `outline-offset`, applied through `:where(…)` so specificity stays at zero
  and any component can still override it.
- **`@media (hover: hover)` around every hover rule.** Adopted despite being
  1-of-5, because the bug it prevents would hit any of the others: on iOS
  Safari `:hover` sticks to the last-tapped element, so the next element
  rendered into that slot inherits a highlight it never earned. Keeping every
  hover rule in one guarded block makes it structurally impossible rather
  than something to remember.

`user-select` stays conditional rather than universal: apps you tap turn it
off with inputs and long-form text opting back in; apps you read leave it on.
Fonts default to the system stack, with `--font-display` as the one hook —
reach for a webfont only when the typeface is doing identity work.

### 11. Every app carries its own operating manual

`README.md` for the mission and the architecture; `CLAUDE.md` for *where
development actually stands*. The split is stated explicitly at the top of
Popcorn's: "Read README.md first for the app's mission — this file tracks
where development actually stands."

Both files are required as of 2026-08-20 (SlotMachine, which has neither, is
the gap to close). The kit ships a template for each.

`CLAUDE.md` reliably contains: a file map, invariants ("do not break these"),
conventions, testing notes, deploy notes, known gaps, and next steps ordered
by leverage. It also carries the **"Waiting on a human"** list — see rule 11b,
which it earned on its own.

### 11b. "Waiting on a human" — required in every project, 2026-08-20

Every `CLAUDE.md` carries a **Waiting on a human** section. It was Liberty's
idea and only Liberty had it; it is now required everywhere, because it is the
best idea in the set and the only one that addresses the actual bottleneck.

**The entry test, which is also the whole rule:**

> Everything here is blocked on something an agent cannot do from a sandbox: a
> credential, a file that needs downloading, a judgement call, or a check
> against the real world. **Nothing in this list is waiting on code.**

If a capable agent with the repo and no outside access could finish it, it does
not belong here — it belongs in "What to do next". That separation is the
point. Mixing the two makes both lists ignorable: the agent cannot act on half
of one, and the human cannot find their half in the other.

**Why it matters more than it looks.** In this way of working the scarce
resource is not code — an agent produces that quickly and cheaply. It is the
handful of things only a person can do: a key that exists only behind a login,
a file behind a network the sandbox cannot reach, a taste decision, a device in
a pocket. Those are what projects actually stall on, and without a dedicated
list they scatter through prose where nobody assembles them. This section is
the interface between the two kinds of work, and it is the page to read when
you have twenty minutes and want to unblock the most.

**Each entry carries five things**, because a bare "set up hosting" rots within
a month once the context behind it is gone:

1. A bold one-line summary of the action.
2. What it unlocks, or what stays broken without it.
3. Why an agent cannot do it — no credential, no network, needs a device,
   needs a decision.
4. The exact commands or clicks, so it is executable without re-derivation.
5. Any trap that silently produces a wrong result rather than an error.

Ordered by leverage. Recurring items are marked and never ticked off. An entry
is deleted when it is genuinely done — a ticked box that is not true is worse
than an open one.

The kit's `CLAUDE.md.template` ships this section **pre-filled**, not as an
empty stub, because a freshly scaffolded app really is blocked on three things:
creating the hosting project and CNAME, replacing the placeholder icon, and
installing it on a real phone. That last one is permanent and unavoidable —
the smoke test drives a desktop Chromium where `env(safe-area-inset-*)` is
zero, so notch and home-indicator bugs are invisible to it, and the iOS
Share → Add to Home Screen gesture cannot be exercised headlessly at all, so
the whole `ios-instructions` branch stays unverified until a person walks
through it on a device.

### 12. A committed smoke test — added 2026-08-20

Every app gets `test/smoke.mjs` and `npm test`. This is the one rule here that
none of the five apps followed; it was added because the gap was the clearest
finding of the whole review. The three static apps have no test of any kind,
and Popcorn's own notes admit the recommendation engine has "no regression
safety net."

The bar is deliberately low and deliberately fixed. The smoke test does not
test app logic — it tests that **the shell still works**: the app boots, one
view is active, tabs switch, the sheet opens and closes on Escape, the worker
activates, saved state survives corrupt and future-version and
wrong-shaped data, and nothing throws. Those are what break when you touch CSS
or move a file, and they are exactly what nobody thinks to re-check by hand.

Two properties it must keep:

- **It serves the app itself on a random port**, so there is nothing to start
  first and no port to collide with.
- **Every assertion must be able to fail.** The first draft asserted that the
  tab bar's bottom edge equalled the viewport height — which, for a
  `position: fixed; bottom: 0` element, is true by construction whatever else
  is broken. It read like a geometry test and could never fail. It was
  replaced with one that makes the page tall, scrolls to the bottom, and
  checks the last line of content clears the bar. **An assertion that cannot
  fail is worse than no assertion, because it buys confidence it has not
  earned.**

Verified against five deliberately introduced regressions: a container losing
its bottom padding, the store losing its corrupt-JSON guard, a tab switch
leaving the old view active, a deleted `--safe-b` token, and a broken service
worker path. All five fail loudly and exit non-zero.

### 13. One apex domain, one subdomain per app

`forest.`, `popcorn.`, `slotmachine.`, `clashofhistory.`, `liberty.` — all on
`thewizardofoza.com`, DNS at the registrar (Hostinger), each app CNAME'd to
whatever host suits it. Cloudflare Pages is the default for static; GitHub
Pages and Vercel both appear; Clash's server is on Fly.io.

The rule that matters is in Liberty's README: **the choice of host must not
require moving the domain's nameservers**, because other apps share the
domain. Adding a subdomain is a single CNAME and touches nothing else.

Deploy runbooks live in `DEPLOY.md` (Popcorn, Clash) or a `## Deploying`
section of the README (Forest, Liberty).

**One more subdomain, 2026-09-21: `api.`** The shared accounts-and-payments
service lives at `api.thewizardofoza.com` on Fly.io. It is one more CNAME and
the rule holds unchanged. Two things fall out of it being on the same apex:
the session cookie can be scoped to `.thewizardofoza.com`, so one sign-in
serves every app; and requests from an app to the API are **same-site**
(different origin, same registrable domain), which is why `SameSite=Lax`
works and CORS-with-credentials is still required. See
[`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md).

### 14. A bug that came back gets written down before it gets fixed — added 2026-09-21

Earned by **Wander**, the sixth app and the first built on the kit, where one
bug — photographs not appearing — was "fixed" and shipped **thirteen times**.
Several of those attempts were the same idea twice, because nobody had written
down that it had already been tried and ruled out.

Four practices came out of that, and they are now house rules. The full
catalogue of what was actually learned is in [`LESSONS.md`](./LESSONS.md);
these are the process rules that stop the next app repeating it.

- **Keep a `docs/BUGLOG.md`.** When a bug recurs, it gets an entry *before* it
  gets a fix: the symptom, the hypothesis, the change. Then come back and
  record what actually happened — **including *made it worse* and *ruled
  out***, which are the two outcomes that save the next session the most time
  and the two nobody thinks to write down.
- **Put the build number in the UI.** Wander shows it in the toolbar and in
  Settings, read from `caches.keys()` rather than from a constant, so a page
  served from a stale cache reports the *stale* number. Three debugging rounds
  were spent not knowing whether a screenshot showed a bug or an old install.
  A screenshot that cannot date itself is not evidence.
- **"Found a mechanism" is not "confirmed the cause."** A plausible mechanism
  found by reasoning, fixed, and shipped, is a hypothesis — and saying
  otherwise is how the same bug got closed three times. Say which it is. The
  thing that settles it is a check against the real world, which means it
  belongs in *Waiting on a human* (Rule 11b), not in a commit message.
- **A stub written from the same reasoning as the code proves nothing.** The
  sandbox could not reach Wikimedia, so the test stub was written from the
  same assumptions as the pipeline it was testing — and agreed with it
  perfectly while production was broken. Where an app depends on a third party
  the test environment cannot reach, the stub is a regression guard, not
  evidence about the third party, and the difference goes in a comment at the
  top of the stub. **This applies directly to Google, Apple and Stripe.**

A fifth, about documentation: Wander added `scripts/check-docs.mjs` to
`npm test`, which verifies that every link between its docs resolves, every
`#anchor` is a real heading, and every path in a file map exists. It cannot
check that what the docs *say* is still true — that is what a dated status
section is for — but it is why the navigation in a 79KB `CLAUDE.md` can be
trusted at all. Worth copying into the kit.

---

## Part 2 — The starter kit

`starter-kit/` in this repo is a complete, working, zero-dependency PWA that
already obeys every rule in Part 1. Copy it, rename it, and you are past all
the plumbing.

```
starter-kit/
  index.html              shell: head tags, topbar, views, tabbar, sheet, toast
  manifest.webmanifest    every required field, marked TODO where app-specific
  sw.js                   network-first worker, shell list, cache versioning
  css/tokens.css          the token contract — the ONE file you retheme
  css/base.css            reset, safe areas, dvh, reduced motion, focus rings
  css/components.css      topbar, tabbar, view, sheet, btn, chip, card, toast…
  js/store.js             namespaced+versioned localStorage with migrations
  js/install.js           the install-prompt table, portable, app-name-driven
  js/ui.js                view switching, sheets, toasts, tab wiring
  js/app.js               where your app actually starts
  icons/build-icons.cjs    one SVG in → full icon set out
  test/smoke.mjs          shell regression test; serves the app itself
  package.json            dev-only — pins the test runner and icon builder
  scripts/new-app.sh      scaffold a renamed copy in one command
  README.md.template      mission + architecture skeleton
  CLAUDE.md.template      the operating-manual skeleton
```

**To start a new app:**

```bash
starter-kit/scripts/new-app.sh ../myapp "My App" myapp "#RRGGBB"
cd ../myapp && npm install && npm test
```

That copies the kit, rewrites the app name / short name / storage namespace /
theme colour everywhere they appear, promotes both doc templates into real
files, and leaves you with something that already installs to a home screen,
works offline, and passes 22 shell checks before you have written a line.

`new-app.sh` substitutes through node rather than `sed`, and verifies its own
output — parsing the generated manifest and `package.json` and syntax-checking
every JS file, then deleting the directory if anything fails. Both came out of
bugs found by trying awkward app names: `sed`'s replacement is not literal, so
*Fish & Chips* became *Fish __APP_NAME__ Chips* and a `|` killed the script;
and a name is a different string in each destination, so `Say "Hi"` produced an
invalid manifest — which browsers ignore **silently**, leaving the app
uninstallable with nothing on the console to explain it. Values are now escaped
per destination syntax, and the same verify-don't-trust reflex as
`build-icons.cjs` catches it if that ever regresses.

The three highest-leverage pieces, in order:

1. **`js/install.js`** — Liberty and Popcorn independently reimplemented the
   same four-outcome table (`android-prompt` / `ios-instructions` /
   `in-app-browser` / `none`), including the same embedded-browser signature
   list and the same "a dead button is worse than no button" reasoning. It
   is now written once, driven by config, and never needs writing again.
2. **`css/tokens.css` + `css/base.css`** — everything in rule §2 and §4 that
   cost Forest and Liberty real debugging time is already correct here.
3. **`icons/build-icons.cjs`** — generalised from Forest's. Point it at one
   SVG and it emits the full opaque, full-bleed, maskable-inclusive set that
   Chrome and Android actually require.

---

## Part 3 — The review queue

Patterns found in three or four of the five apps, not all. Listed with who
does and who doesn't.

### Decided 2026-08-20

| Item | Decision |
|---|---|
| `prefers-reduced-motion` | **Adopted** — now rule 10b |
| `:focus-visible` | **Adopted** — now rule 10b |
| `@media (hover: hover)` guard | **Adopted** — now rule 10b |
| `README.md` + `CLAUDE.md` | **Adopted** — now rule 11, both templates ship |
| `user-select` | **Conditional** — tap apps off, reading apps on |
| Webfonts | **System stack by default**, webfont only for identity work |
| Install-prompt UI | **Ships by default** in the kit; delete the button per app |
| Service-worker strategy | **Network-first** is the house default |
| ES modules vs script tags | **ES modules** — no build step, must be served over http |
| Error visibility | **Committed smoke test** — now rule 12. No telemetry adopted |

### Still open

**Should Clash get a service worker?** It ships a manifest and full install
support but no worker, so it is installable and not offline-capable. This is
a question about an existing app rather than about the kit, so it was left out
of the kit decisions.

**Is there a middle path on telemetry?** The smoke test closes the CI half of
the feedback gap. The field half is still open: a crash on some Android WebView
is invisible forever, and you cannot tell a broken feature from an unused one.
A self-hosted, no-cookie, no-identifier error endpoint would violate none of
the stated principles. Deliberately not adopted — noting it so the decision
stays a decision rather than an oversight.

---

The original review notes follow, kept for the reasoning behind each call.

### 3a. `prefers-reduced-motion` — 4 of 5

**Has it:** Liberty, Forest, Popcorn, Clash. **Missing:** SlotMachine.

Two different implementations even among the four: Popcorn and Liberty use
the blanket `*, *::before, *::after { animation-duration: 0.01ms !important }`
kill switch; Forest inverts it and only *adds* animation inside
`@media (prefers-reduced-motion: no-preference)`. SlotMachine is the most
animation-heavy app in the set and has no handling at all.

*My read: this should be promoted to a rule, with Forest's inverted form as
the house pattern. The kit ships the blanket version because it is safer to
retrofit.*

### 3b. `:focus-visible` styling — 3 of 5

**Has it:** Liberty, Popcorn, Clash. **Missing:** Forest, SlotMachine.

Liberty's is the good one — `2px solid var(--gold-bright)` with
`outline-offset: 2px`, applied via `:where(a, button, input, textarea, select,
[tabindex])` so specificity stays at zero.

*My read: promote. It is four lines and it is the difference between
keyboard-usable and not. The kit includes Liberty's version.*

### 3c. Install prompt UI — 3 of 5

**Has it:** Liberty, Popcorn, Clash. **Missing:** Forest, SlotMachine.

All five are *installable*; only three ever offer. Forest instead ships an
Android APK wrapper (Capacitor, built in CI). SlotMachine relies entirely on
the browser's own affordance.

*My read: needs your call, because it is a product question, not a technical
one. If most traffic arrives from a shared link, the offer is worth a lot; if
people find the app once and keep it, the browser's own prompt is enough.*

### 3d. `user-select: none` on `body`, with inputs opting back in — 4 of 5

**Has it:** Forest, Popcorn, SlotMachine, Clash. **Missing:** Liberty.

Both stated reasons are good and they conflict, which is why this is here
rather than in Part 1. Clash: *"This is a game, not a document."* Popcorn:
*"This is a tap-driven app, not a document."* Liberty is genuinely a
*reading* tool, so selection has to work.

*My read: keep it conditional. Rule should be "apps you tap: off, with
`input, textarea` and any long-form text opting back in. Apps you read: on."
Note Popcorn already carves out `.detail-title` because copying an exact
movie title to paste into a streaming search is a real thing people do.*

### 3e. Local-first, no server — 4 of 5

**Has it:** Forest, Popcorn, SlotMachine, Clash (client state).
**Different:** Liberty (Postgres + nightly ingestion; only the install flag is
local).

*My read: this is a consequence of what each app is, not a preference to
enforce. Worth stating as a default though: "no server until the data
genuinely cannot live on the device."*

### 3f. Service worker — 4 of 5

**Has it:** Liberty, Forest, Popcorn, SlotMachine. **Missing:** Clash.

Clash ships a manifest and full install support but no worker, so it is
installable and not offline-capable. Also note SlotMachine's worker is
**cache-first** (stale-while-revalidate) while Forest's and Popcorn's are
**network-first** — a real behavioural difference in how fast a deploy
reaches users.

*My read: two things to rule on — whether Clash should get one, and whether
network-first is the house default. The kit uses network-first, matching the
majority.*

### 3g. `README.md` and `CLAUDE.md` — 4 of 5

**Has both:** Liberty, Forest, Popcorn, Clash (plus `AGENTS.md` and
`RULES.md`). **Has neither:** SlotMachine.

*My read: promote to a rule; SlotMachine is simply the gap. The kit ships a
`CLAUDE.md.template`.*

### 3h. A Google-hosted display font — 2 of 5 (noting it as the low end)

**Has it:** Forest (Nunito, used for body), Clash (Cinzel, headings only).
**System stack only:** Liberty, Popcorn, SlotMachine.

Below your 3–4 threshold, but flagging it because it is the only third-party
runtime request any of these apps make, which sits oddly against §7. Both
apps that use one `preconnect` to both font origins first.

*My read: default to a system stack with `--font-display` as the one hook.
Reach for a webfont only when the typeface is doing identity work — as Cinzel
is for Clash.*

### 3i. `@media (hover: hover)` guard on hover styles — 1 of 5

**Has it:** Popcorn only.

Listed despite being 1/5 because the bug it fixes is real and would hit any
of the others: on iOS Safari, `:hover` sticks to the last-tapped element, so a
newly rendered card in the same slot inherits the highlight. Popcorn keeps
*every* `:hover` rule in one `@media (hover: hover)` block.

*My read: cheap insurance, worth adopting. The kit does it.*

---

## Quick reference — the checklist

```
[ ] manifest: standalone, portrait, 192+512 PNG, maskable copy, categories
[ ] head: viewport-fit=cover, theme-color, apple-* tags, apple-touch-icon
[ ] 100dvh + env(safe-area-inset-*) behind a variable; bg on <html>
[ ] html { overflow-x: hidden }; touch targets >= 44px
[ ] .topbar / .view.active / .tabbar shell, data-view switching
[ ] palette as :root tokens, named by role, commented where non-obvious
[ ] localStorage key "<app>:v1", guarded accessors, migration on bump
[ ] service worker: network-first, skipWaiting + claim, no huge precache
[ ] zero analytics / ads / third-party runtime services
[ ] no package.json unless there is a real server or real client state
[ ] messy platform logic behind a pure function over a snapshot
[ ] comments explain why; write the paragraph if a cleanup could regress it
[ ] README.md (mission + architecture) and CLAUDE.md (state of play)
[ ] CLAUDE.md has a "Waiting on a human" list — and nothing on it needs code
[ ] prefers-reduced-motion, :focus-visible, hover rules behind (hover: hover)
[ ] npm test green — and every assertion in it can actually fail
[ ] one subdomain, one CNAME, nameservers untouched
```

### Accounts and payment — see [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md)

```
[ ] app boots, deals and is fully usable with the API origin blocked
[ ] free version complete; export NEVER gated; no sign-in wall on first launch
[ ] Google + Apple scripts load on tap, not in <head>
[ ] accounts keyed on provider `sub`, never on email; no auto-link by email
[ ] the Stripe WEBHOOK grants the entitlement — never the success URL
[ ] webhook: raw body for signature, idempotent by event.id, refunds revoke
[ ] price is server-side; the client never names an amount
[ ] cached entitlement never expires into "unpaid" when the API is unreachable
[ ] CSP: script-src, frame-src, connect-src, img-src, form-action verified in
    a REAL browser console — not reasoned about, not stubbed
[ ] CORS: allowlist-echoed origin + credentials + Vary: Origin (never `*`)
[ ] sw: no authenticated responses in the shell cache, no index.html for a 401,
    OAuth redirects not intercepted
[ ] Apple client secret generated from the .p8 at request time (it expires)
[ ] no secret in any repo, fly.toml, commit message or screenshot
```

### Before debugging anything

```
[ ] read LESSONS.md by symptom first — it is thirteen paid-for bugs
[ ] the build number is visible in the UI, so a screenshot dates itself
[ ] "found a mechanism" is not "confirmed the cause"
```
