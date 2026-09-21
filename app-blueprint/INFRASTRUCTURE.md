# Accounts, payments and the services behind them

*Written 2026-09-21. This is the newest part of the blueprint and the one that
changes the shape of the house rules, so read the first section before
anything else — it is a decision, not a description.*

Every app now ships:

- **Sign in with Google** and **Sign in with Apple**.
- **A free version that is genuinely complete**, and a **one-time $5 unlock**.
- Whatever it needs behind that to stay up: an API, a database, a host.

[`APP_DESIGN_RULES.md`](./APP_DESIGN_RULES.md) describes apps with *"no
tracking and no monetisation"* that *"store the user's data on the user's
device"*. Two thirds of that sentence survives. See
[Rule 7, amended](#rule-7-amended--what-money-does-and-does-not-change) for
what changed and what must not.

## Contents

- [The one decision everything else follows from](#the-one-decision-everything-else-follows-from)
- [Rule 7, amended](#rule-7-amended--what-money-does-and-does-not-change)
- [What goes on the server, and what stays on the device](#what-goes-on-the-server-and-what-stays-on-the-device)
- [Identity — Google](#identity--google)
- [Identity — Apple](#identity--apple)
- [Sessions and linking two providers to one human](#sessions-and-linking-two-providers-to-one-human)
- [Payments — Stripe](#payments--stripe)
- [Entitlement — how the app knows, including offline](#entitlement--how-the-app-knows-including-offline)
- [Drawing the free/paid line](#drawing-the-freepaid-line)
- [The database](#the-database)
- [Hosting the service — Fly.io](#hosting-the-service--flyio)
- [CSP, CORS and the service worker](#csp-cors-and-the-service-worker)
- [Every credential, in one table](#every-credential-in-one-table)
- [Recurring costs](#recurring-costs)
- [The traps, collected](#the-traps-collected)
- [What to build, in order](#what-to-build-in-order)

---

## The one decision everything else follows from

**One shared service for every app. Not one per app.**

The apps stay what they are: static, zero-dependency, offline-first PWAs on
their own subdomains. What they gain is a single backend they all talk to:

```
wander.thewizardofoza.com   ─┐
popcorn.thewizardofoza.com  ─┤
forest.thewizardofoza.com   ─┼──►  api.thewizardofoza.com   ──►  Postgres
animas.thewizardofoza.com   ─┤      (Fly.io, one app)
…every future app           ─┘      accounts · entitlements · webhooks
```

Everything on the right-hand side exists **once**: one Google OAuth client,
one Apple Services ID, one Apple private key to rotate, one Stripe account,
one webhook endpoint, one database, one Fly app, one set of secrets, one
deploy. Each new app adds a row to a `products` table and a Stripe Price. That
is the whole per-app cost of monetisation.

The alternative — auth and billing inside each app — multiplies every
credential, every rotation, every CSP header and every bug by the number of
apps, and guarantees that app #4 gets a subtly different sign-in flow from app
#1. It also means a person who bought two of your apps has two accounts.

**The consequences of this call, spelled out, because they are load-bearing:**

1. **The apps stay static.** No app gets a build step or a server. They make
   `fetch()` calls to one origin. Rule 8 (no runtime dependencies, no build
   step) survives intact for every app; the *service* is the one place with
   dependencies, and it is not an app.
2. **One account works across all the apps.** Sign in once on the same device
   and every app on the apex domain sees the session, because the cookie is
   set on `.thewizardofoza.com`. That is a real feature and it falls out for
   free.
3. **Entitlements are per-app, not per-account.** Buying Wander does not
   unlock Popcorn. The `entitlements` table is keyed `(user_id, app_slug)`.
   If you ever want a bundle, it is a row, not a rewrite.
4. **The service is now a single point of failure for sign-in and purchase in
   every app.** It must not be a single point of failure for *using* an app —
   see [Entitlement](#entitlement--how-the-app-knows-including-offline). An
   app whose deck stops dealing because an API in Virginia is down has thrown
   away the entire reason it was built offline-first.
5. **`api.` is a subdomain, so this is still one CNAME**, and Rule 13 holds:
   the nameservers never move.

---

## Rule 7, amended — what money does and does not change

The original rule is **"No tracking, no ads, no dark patterns"**, and the
reason it reads as *"no monetisation"* is that none of the first five apps had
any. That is now out of date. The principle underneath it is not.

### Still absolutely true

- **No analytics, no tag managers, no session recorders, no ad networks, no
  error-reporting SaaS.** Adding Stripe does not open the door to Segment.
- **No dark patterns.** Named, so there is no wriggle room later:
  - No countdown timers, fake scarcity, or "3 people are viewing this".
  - No subscription for an app that costs nothing to run. A local-first app
    that does no server work has no recurring cost to pass on, and charging
    rent for it is the thing this house does not do.
  - No free trial that silently becomes a charge.
  - No deliberately crippling the free version to make the paid one look
    better. See [Drawing the free/paid line](#drawing-the-freepaid-line).
  - **No holding the user's own data hostage.** Export works in the free
    tier, always, unconditionally. This is the hardest line in the document:
    the moment a paywall stands between someone and their own data, the app
    has become the thing Rule 7 exists to prevent.
  - No retroactive paywalling. Something that shipped free stays free for
    everyone who already has it.
- **No account required to use the free version.** The app opens and works.
  An account exists to carry a *purchase* between devices, not to gate the
  product. First launch shows the app, not a sign-in wall.

### Now true, and new

- **A one-time $5 unlock is the house monetisation model.** One price, paid
  once, per app. No tiers, no consumables, no currency.
- **There are now three third-party origins at runtime** — Google, Apple and
  Stripe — plus one first-party API. The distinction that keeps this honest:
  these are **functional** third parties the user invoked deliberately by
  tapping "Sign in" or "Buy", not **surveillance** third parties watching a
  user who did not ask for them. A free user who never signs in and never
  buys still makes **zero** third-party requests. Keep that property: load
  the Google, Apple and Stripe scripts **lazily, on tap**, never in `<head>`.
  This is both a privacy property and a performance one, and it is easy to
  lose by pasting a vendor's copy-paste snippet into the shell.

### Write it down in the app

Rule 10's "comments explain why" applies to product decisions too. Each app's
`CLAUDE.md` gets one line under Invariants: *"The free version is complete.
Export is never gated. The unlock is one payment, forever."* That sentence is
what stops a future session, reasoning locally and sensibly, from shipping a
subscription.

---

## What goes on the server, and what stays on the device

Rule 5 — *the user's data is theirs, on their device* — is not repealed. The
server holds the smallest possible amount, and none of it is the user's
content.

| Lives on the server | Stays in `localStorage` |
|---|---|
| Account row (id, created) | Everything the app is about |
| Provider identities (Google `sub`, Apple `sub`) | Saved items, trips, decks, sessions, scores |
| Display name and email, if given | Preferences, theme, filters |
| Entitlement rows: who bought what, when | The cached copy of the entitlement |
| Stripe customer id, payment/refund events | |
| *(optional, later)* an opaque encrypted sync blob | |

**The default is no sync.** Cross-device sync is a separate product decision
with its own failure modes (conflict resolution, partial writes, a bug that
overwrites a good device from a bad one), and it is not required by "sign in"
or by "$5". Ship accounts and payments first; decide on sync later, and if you
do it, do it as an opaque blob the server cannot read, so the server never
becomes a copy of the user's life.

**The consequence, which must be in the purchase UI:** signing in does not
back up your data. The Download-backup button from Rule 5 is still the only
thing that does. Say so in Settings, next to the account row, in plain words.

---

## Identity — Google

Use **Google Identity Services** (the `gsi/client` library). The browser gets
an **ID token** — a signed JWT — and hands it to your API, which verifies it.
The browser never sees a secret.

```
tap "Sign in with Google"
   → load https://accounts.google.com/gsi/client   (lazily, first tap only)
   → GIS returns { credential: "<ID token JWT>" }
   → POST https://api.thewizardofoza.com/v1/auth/google  { credential }
   → server verifies signature against Google's JWKS
   → server checks  iss ∈ {accounts.google.com, https://accounts.google.com}
                    aud == YOUR_GOOGLE_CLIENT_ID
                    exp not passed
                    email_verified == true
   → upsert identity (provider="google", subject=payload.sub)
   → set session cookie
```

**Verify the token on the server. Always.** An ID token is just a string the
client sent you; decoding it without checking the signature means anyone can
POST a JSON blob claiming to be anyone. Use Google's own library
(`google-auth-library`, `client.verifyIdToken({ idToken, audience })`) rather
than a hand-rolled JWT check — it handles JWKS fetching, caching and key
rotation, which is exactly the fiddly part.

**Key on `sub`, never on email.** `sub` is Google's stable, immutable user id.
Email addresses change, get reassigned inside Workspace domains, and are not
unique across providers. An account keyed on email is an account-takeover bug
waiting for someone to notice.

**Traps:**

- **Authorized JavaScript origins must list every subdomain.** Every app is a
  different origin. `wander.thewizardofoza.com` working does not mean
  `popcorn.thewizardofoza.com` works — that one returns an error in the
  console and nothing on screen. Add each origin as you launch each app, and
  put it in the app's own launch checklist so it is not discovered on the day.
- **`http://localhost:PORT` must be added explicitly for development**, with
  the port. Google permits localhost; it does not permit a random port you did
  not register.
- **The OAuth consent screen must be published**, not left in "Testing".
  In Testing mode only the handful of accounts you listed can sign in, and
  everyone else sees a generic error that does not say why. A Google-fonts-free
  app requesting only `openid email profile` does not need a security review,
  so publishing is a form, not an audit — but it *is* a manual step and it is
  easy to leave undone.
- **`lh3.googleusercontent.com` in `img-src`** if you display the avatar. If
  you do not need the picture, do not request it — the fewer fields, the fewer
  headers.

---

## Identity — Apple

Sign in with Apple is materially harder than Google and has more ways to fail
silently. Budget more time for it than feels reasonable. **Do it second**, on a
working Google flow, so you are debugging one unfamiliar thing at a time.

Use **Sign in with Apple JS** (`appleid.auth.js`) for the web flow. The shape
is the same — you end up with an `id_token` JWT to verify against Apple's JWKS
at `https://appleid.apple.com/auth/keys`, checking `iss ==
https://appleid.apple.com` and `aud == <your Services ID>`.

### The five traps, in the order they will bite you

1. **Apple gives you the user's name exactly once, ever.** It is in the
   *first* authorization response — not in the ID token, in the form POST body
   — and it is never sent again. If you do not persist it on that first
   request, it is gone permanently, and the only way to get another one is for
   the user to revoke the app in their Apple ID settings and sign in again. Do
   not write the "save the profile" code in a later pass. Write it first.
2. **The client secret is a JWT you generate, and it expires — six months
   maximum.** There is no long-lived Apple client secret. You sign one from a
   `.p8` key with your Team ID and Key ID, and when it lapses, sign-in stops
   working for everyone with an error that looks like a misconfiguration
   rather than an expiry. Generate it in code at request time from the `.p8`
   (which does not expire) rather than pasting a six-month string into an env
   var and setting a calendar reminder you will ignore. **This is the single
   most common way a shipped Sign-in-with-Apple integration dies.**
3. **Private Relay emails.** Most users will hide their address and you will
   get `something@privaterelay.appleid.com`. It is a real, deliverable address
   — but only if you register your sending domain with Apple first, otherwise
   mail to it bounces. And because it is per-app-per-user, the same human
   signing in with Google and with Apple gives you two different email
   addresses. **This is why identity is keyed on `sub`, and why you must not
   auto-merge accounts by email.**
4. **No localhost.** The `redirect_uri` must be HTTPS and a real registered
   domain. You cannot develop the Apple flow against `http://localhost`. You
   will need a deployed staging origin, or a tunnel with a stable hostname, and
   either way Apple must have been told about it in advance.
5. **Domain verification is a separate step from everything else.** Apple
   requires `apple-developer-domain-association.txt` served from
   `/.well-known/` on each domain you use. A static-site host serving it with
   the wrong content type, or redirecting it, fails verification with a message
   that does not identify which of those it was.

### Also worth knowing before you start

- **An Apple Services ID is not an App ID.** Web sign-in uses a **Services
  ID**, configured with its own domains and return URLs, associated with a
  primary App ID that has the Sign In With Apple capability enabled. Getting
  these confused costs an afternoon.
- **It requires a paid Apple Developer Program membership** — $99/year, with
  a real identity check. There is no free tier, and enrolment is not instant.
  If nothing else in this document has been started, start this, because the
  waiting is the long pole.
- **The button has brand rules.** Apple's Human Interface Guidelines specify
  the button's appearance, corner radius, and the fact that it must not be
  smaller or less prominent than the other sign-in options. Use Apple's own
  rendered button rather than styling your own.
- **App Store rule, for later:** if any of these is ever wrapped and shipped
  to the App Store with another third-party sign-in, Apple requires Sign in
  with Apple to be offered alongside it. Shipping it now means that door is
  already open.

---

## Sessions and linking two providers to one human

**After either provider verifies, issue your own session.** Do not keep using
the provider's token — it expires on their schedule, it carries their claims,
and it makes every request depend on their uptime.

**Session shape:** an opaque random token (or a short-lived signed JWT with a
refresh) in an **HttpOnly, Secure cookie** scoped to `Domain=.thewizardofoza.com`,
`SameSite=Lax`, `Path=/`. Not `localStorage` — a token in `localStorage` is
readable by any XSS, and these apps build DOM from catalog data.

**Why `SameSite=Lax` is enough across the subdomains, and this is the detail
people get wrong:** `SameSite` is evaluated per *site* (registrable domain),
not per *origin*. `wander.thewizardofoza.com` and `api.thewizardofoza.com` are
the same site, so the cookie is sent on `fetch()` between them. It is still a
**cross-origin** request, so it needs CORS with credentials — see
[CSP, CORS and the service worker](#csp-cors-and-the-service-worker). Get one
of those two halves and not the other and you get a 401 that looks like an
auth bug and is a header bug.

**Linking.** One human, potentially two providers:

```
users        (id, display_name, created_at)
identities   (user_id, provider, subject, email, PRIMARY KEY (provider, subject))
```

- Sign-in looks up `(provider, subject)`. Found → that user. Not found → new
  user, new identity.
- **Do not auto-link on matching email.** Apple Private Relay means the emails
  genuinely differ for the same person, so auto-linking would only ever fire on
  users who did *not* hide their address — and where it does fire, "this email
  matches" is a claim from a third party, which is thin evidence on which to
  merge two accounts. Offer **explicit** linking in Settings instead: signed in
  already, tap "Also link Apple", and attach the new identity to the current
  session's user.
- Consequence to state plainly in the purchase flow: *the account you buy with
  is the account that owns it.* Someone who buys with Google and later signs in
  with Apple sees the free version, will believe they have been charged for
  nothing, and will be right to be annoyed. Mitigations, in order of value:
  make the "restore purchase" path obvious; show which provider is signed in;
  and on a fresh sign-in that finds a paid account under the *other* provider's
  email, offer to link rather than saying nothing.

**Sign-out** clears the cookie **and** the cached entitlement **and** leaves
local app data alone. Signing out of an account is not a request to delete the
trips on the phone.

**Account deletion** must exist and must actually delete: the user row, the
identities, and the entitlements. Keep the Stripe payment records — they are
financial records with their own retention requirements — but they are in
Stripe, not in your database, so the deletion is clean. Apple's App Store
guidelines require account deletion to be available in-app for anything
shipped there; build it now rather than retrofitting it under review pressure.

---

## Payments — Stripe

**Stripe Checkout, `mode: "payment"`.** Not Subscriptions, not Payment Links
(you need to attribute the purchase to a user), not the Payment Element
(Checkout is a hosted page Stripe maintains, and for a $5 one-shot the
customisation is not worth owning the PCI surface).

```
tap "Unlock — $5"
   → POST /v1/checkout        (session cookie identifies the user)
   → server: stripe.checkout.sessions.create({
         mode: "payment",
         line_items: [{ price: PRICE_ID_FOR_THIS_APP, quantity: 1 }],
         client_reference_id: user.id,
         customer: user.stripe_customer_id ?? undefined,
         success_url: "https://<app>/?purchase=done",
         cancel_url:  "https://<app>/?purchase=cancelled",
     })
   → 200 { url }  → browser redirects to Stripe
   → user pays on Stripe's page
   → Stripe POSTs checkout.session.completed to /v1/stripe/webhook
   → server verifies the signature, writes the entitlement   ◄── THE GRANT
   → browser lands back on success_url, calls /v1/me, sees paid
```

### The five rules that matter

1. **The webhook grants the entitlement. The success URL never does.** The
   success URL is a string in the address bar that anyone can type. If the
   grant lives there, the product is free to anyone who reads the page source
   once. Treat the redirect purely as "show a thank-you and re-fetch `/v1/me`".
2. **Verify the webhook signature against the raw request body.** Use
   `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`. If
   the framework has already JSON-parsed and re-serialised the body, the bytes
   differ and verification fails on a request that is perfectly valid — an hour
   lost to a 400 that looks like Stripe's fault. Register the raw-body handler
   for the webhook route *before* the global JSON body parser.
3. **Be idempotent.** Stripe retries a webhook it did not get a 2xx for, and
   it can deliver the same event more than once regardless. The handler must
   upsert, never insert-and-assume. Store the `event.id` and ignore repeats.
   Return 2xx quickly; do slow work after acknowledging, or Stripe's timeout
   turns a successful payment into a retry storm.
4. **The price is a server-side constant.** The client sends nothing about
   money — no amount, no currency, not even the price id. It sends "unlock
   this app" and the server looks up the Price. A client that can name the
   amount is a client that can name fifty cents.
5. **Test mode and live mode are two separate worlds.** Separate keys,
   separate Products, separate Price ids, separate webhook endpoints, separate
   signing secrets, separate dashboards. A live secret key with a test price
   id fails with an error that says the price does not exist, which reads like
   a typo. Put the mode in the env var name if that helps you keep them apart,
   and never let a test key reach production — a "successful" purchase that
   charged nobody is worse than a failure.

### Also handle

- **`charge.refunded` and `charge.dispute.created` → revoke the entitlement.**
  Easy to skip, and it means a refunded user keeps the product forever.
- **`checkout.session.expired`** → nothing to do, but log it; a lot of these
  means the Checkout page is losing people.
- **Store `stripe_customer_id` on the user** the first time, so a second
  purchase (another app) attaches to the same customer and the person sees one
  coherent receipt history.
- **Use the Stripe CLI to develop** — `stripe listen --forward-to
  localhost:PORT/v1/stripe/webhook` gives you a working local webhook with a
  signing secret, and `stripe trigger checkout.session.completed` fires one on
  demand. Do not try to test webhooks by making real test purchases one at a
  time.
- **VAT/sales tax on a $5 digital good is a real question**, not a formality —
  digital goods sold to EU consumers have VAT obligations from the first sale,
  with no threshold. **Stripe Tax** handles calculation and collection for a
  fee. This is a decision to make deliberately with someone qualified, not a
  thing to discover later; it is on the [Waiting on a human](#what-to-build-in-order)
  list for exactly that reason.
- **Apple's cut, if these ever become native apps.** On the open web, Stripe
  is fine and Apple has no claim. Inside an App Store binary, unlocking
  digital functionality must go through In-App Purchase at Apple's commission,
  and linking out to a web purchase has its own contested rules. This does not
  affect anything today; it affects whether "wrap it with Capacitor" is as
  cheap as it sounds. *(Verify the current rules before acting — this area has
  been under active legal change and my knowledge of the present state is not
  reliable.)*

---

## Entitlement — how the app knows, including offline

This is where an offline-first app and a server-held purchase have to be
reconciled, and it is the part most likely to produce a bug that only a paying
customer sees.

**The shape:**

```js
// GET /v1/me  →
{ user: { id, name }, entitlements: { wander: { paid: true, since: "2026-09-21" } } }
```

The client caches that answer in `localStorage` under the app's own namespace
and treats the cache as authoritative for the UI.

### The rules

- **A cached entitlement never expires into "unpaid".** If the API cannot be
  reached, the last known answer stands — for days, indefinitely, whatever it
  takes. Downgrading a paying customer because their train went into a tunnel
  is the worst failure this system can produce: it is invisible to you,
  infuriating to them, and it looks exactly like you took their money and
  removed the product. Re-check in the background when the network returns;
  never block on it.
- **A *negative* answer is cached weakly, a *positive* answer strongly.** Same
  asymmetry as Wonder's photo cache, for the same reason (see
  [`LESSONS.md`](./LESSONS.md), *an empty answer is never written to the
  device*): "we could not reach the server" and "this user has not paid" are
  different facts that arrive looking identical, and persisting the second when
  you meant the first is a permanently broken app on someone's phone. Treat
  "not paid" as a session-level assumption; treat "paid" as durable.
- **Client-side gating is UX, not enforcement.** Anyone can edit
  `localStorage`. Accept it. This is a $5 app, not DRM — the goal is that
  paying is easy and pleasant, not that piracy is impossible, and every hour
  spent on the latter is an hour not spent on the app. Verify server-side only
  where a request costs you money or touches someone else's data.
- **Check at launch and on `visibilitychange` → visible**, both in the
  background, both non-blocking. A purchase made on a laptop should appear on
  the phone the next time it is opened, without a manual "restore" step.
- **"Restore purchases" exists anyway**, as a visible button, because the
  background path will occasionally not have run and the user has no way to
  know that. It is one line: clear the cache, re-fetch `/v1/me`.
- **The free app must boot with the API unreachable, signed out, forever.**
  Test this. It is one line in the smoke test — block the API origin and assert
  the app still deals a full deck — and it is the assertion that stops the
  shared service from quietly becoming a hard dependency.

---

## Drawing the free/paid line

The hard part is not the code; it is deciding what $5 buys. The house position:

**The free version is a complete, honest, recommendable app.** Someone who
never pays should feel they got something good, not something broken. If the
free tier's job is to be annoying, the paid tier is not a product, it is a
ransom.

**Good things to charge for** — more of what the app already does well, or
things that genuinely cost you money:

- Unlimited of a thing that is limited but useful (3 trips free, unlimited
  paid — where 3 is enough to be useful, not a taste).
- Depth: the full catalog where free gets a large curated subset; advanced
  filters; the complete history where free keeps the last month.
- Convenience: cross-device sync, cloud backup — these have real server cost,
  so charging for them is honest in a way that charging for a local feature is
  not.
- Cosmetics: themes, icons.

**Never behind the paywall:**

- **Export / download backup.** Rule 5. Non-negotiable, restated here because
  it is the one a reasonable person would get wrong.
- Anything that was free before.
- Anything whose absence makes the free app *feel broken* rather than
  *smaller*. The test: would you recommend the free version to a friend
  without apologising for it? If not, the line is in the wrong place.

**Per-app, write the line into `CLAUDE.md`** under Invariants, with the
reasoning. "What is free" is exactly the kind of decision a future session will
re-derive differently and sensibly, and the sensible local decision is how a
product ends up with a subscription nobody chose.

---

## The database

**Postgres, one instance, one schema, shared by all apps.** The tables are
small and the load is trivial — a handful of writes per sign-in and per
purchase. This is not a scaling problem and should not be designed as one.

```sql
users        id, display_name, email, stripe_customer_id, created_at, deleted_at
identities   provider, subject, user_id, email, linked_at
             PRIMARY KEY (provider, subject)
entitlements user_id, app_slug, status, source, granted_at, revoked_at
             PRIMARY KEY (user_id, app_slug)
             status ∈ paid | refunded | comped
             source ∈ stripe | manual
webhook_events  event_id PRIMARY KEY, type, received_at   -- idempotency
sessions     token_hash, user_id, created_at, expires_at, last_seen_at
```

- `entitlements.source = manual` so you can grant a copy to a friend, a
  reviewer, or someone whose payment went wrong, without a fake Stripe charge.
- `sessions.token_hash`, not the token. A leaked database dump should not be a
  set of working logins.
- `users.deleted_at` for soft delete, with a job that hard-deletes — or just
  hard-delete. Either is fine; deciding neither is not.

**Choosing the host — the thing to actually check.** Fly's *unmanaged* Postgres
(the one `fly launch` historically offers to create) is a Postgres app running
on a Fly volume, not a managed database: **you** own backups, upgrades and
failover, and if the volume is lost the data is lost. Fly's own documentation
has been explicit about this. They have since offered a managed option, and
Neon and Supabase are both good managed Postgres providers with free tiers
adequate for these tables.

*Confidence note: the unmanaged-Postgres caveat is longstanding and I am
confident about the principle; the exact current product names and tiers on
Fly, Neon and Supabase are the kind of detail that moves every few months —
**check the current docs before choosing**, and do not take my word for what
the free tier includes today.*

**Whatever you choose: automated daily backups, and one restore actually
performed.** An untested backup is a belief, not a backup — and here the data
is "who paid you", which cannot be reconstructed from anything except Stripe's
records and a bad afternoon.

---

## Hosting the service — Fly.io

One Fly app, `<something>-api`, serving `api.thewizardofoza.com`.

- **`fly secrets set` for every credential.** Secrets are injected as
  environment variables at runtime and are not in the image, not in
  `fly.toml`, not in git. `fly.toml` is committed; it must contain no secrets.
- **Do not scale the auth path to zero.** `min_machines_running = 0` saves
  money and costs a cold start on the first request. For the webhook that is
  fine (Stripe retries). For someone tapping "Sign in" it is a two-to-three
  second stall on the most abandonment-prone screen in the app. Keep at least
  one machine warm in the primary region; it is a few dollars a month and it
  buys the impression that sign-in is instant.
- **Health check on `/healthz`**, and it must check the database, not just
  that the process is up. A service that answers 200 while Postgres is
  unreachable is a service that reports healthy through the entire outage.
- **Place it near the users.** One region. These are personal apps on one
  person's domain; multi-region is complexity with no payoff.
- **Logs are ephemeral.** `fly logs` is a tail, not a record. If you need to
  answer "did this user's webhook arrive last Tuesday", that has to be a row
  in `webhook_events`, not a log line.

**The stack:** whatever is smallest that you will maintain. Node with a thin
HTTP framework keeps the language the same as everything else in the house and
means the Stripe and Google libraries are first-party. This service is the one
place in the whole estate where dependencies are allowed — keep it to
Stripe, `google-auth-library`, a JWT/JWKS library for Apple, a Postgres
driver, and nothing else.

---

## CSP, CORS and the service worker

**This section is the one most likely to cost a day**, because every failure in
it happens *only in production*, silently, with nothing in the page console
that names the cause. Wonder lost a full debugging cycle to exactly this — a
CSP directive that allowed one Wikimedia host and not the one the API actually
answered with — and the shape repeats here. See
[`LESSONS.md`](./LESSONS.md), *CSP is a production-only failure mode*.

### CSP

The apps ship a strict CSP in `_headers`. Sign-in and payment will violate it
in several directions at once:

```
script-src  'self' https://accounts.google.com https://appleid.cdn-apple.com https://js.stripe.com
frame-src   https://accounts.google.com https://appleid.apple.com https://js.stripe.com https://hooks.stripe.com
connect-src 'self' https://api.thewizardofoza.com https://accounts.google.com https://appleid.apple.com https://api.stripe.com
img-src     'self' data: https://lh3.googleusercontent.com
form-action 'self' https://appleid.apple.com https://checkout.stripe.com
```

**Treat that block as a starting hypothesis, not as an answer.** It is written
from how these SDKs are documented to behave, and the Wonder lesson is
precisely that reasoning about a third-party API and then testing against a
stub built from the same reasoning proves nothing. On first integration, open
the real thing in a real browser with the console open, read the actual
violation reports, and correct the list against what they say. Then write the
corrected list down with a comment naming which feature needs each host —
otherwise the next session tightening the CSP removes one and breaks payment
in production only.

**Three specific hazards:**

- **`frame-src` is required and easy to miss.** Google One Tap and Stripe
  Checkout both use iframes. Allowing the script and forgetting the frame
  gives a button that does nothing at all when tapped.
- **The CSP applies to the service worker too.** Anything the worker fetches
  needs `connect-src`, even though from the page's point of view it is an
  `<img>` or a navigation. This is the exact form of the Wonder bug.
- **`form-action`** catches Apple's form POST redirect. If it is set to
  `'self'` and Apple's flow posts elsewhere, the redirect is blocked with a
  message that does not mention `form-action`.

### CORS

The API must answer preflight for each app origin:

```
Access-Control-Allow-Origin: https://wander.thewizardofoza.com   (echoed, from an allowlist)
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Methods: GET, POST, OPTIONS
Vary: Origin
```

- **`Allow-Origin: *` is invalid with credentials.** The browser rejects it,
  and the error message talks about the wildcard rather than about the cookie,
  so it reads as a CORS bug rather than an auth one.
- **Echo from an allowlist; never reflect the `Origin` header blindly.**
  Reflecting it means any site anywhere can make credentialed requests as your
  signed-in user. The allowlist is one array of app origins and it is the
  security boundary of this whole design.
- **Every `fetch` to the API needs `credentials: "include"`.** Omit it and
  the cookie is not sent, and every authenticated call 401s while the cookie
  is visibly present in devtools.
- `Vary: Origin` or a cache will hand one app's CORS header to another app.

### The service worker

Three rules, each a real failure:

- **Never cache an authenticated API response in the shared shell cache.**
  Shared caches and per-user responses do not mix; the failure mode is one
  user's `/v1/me` served to another on a shared device.
- **Never serve the `index.html` navigation fallback for an API request.** A
  401 becomes a 200 with an HTML body, `response.json()` throws a parse error,
  and the actual cause — an expired session — is nowhere in the message. Scope
  the fallback to same-origin navigations only.
- **Do not intercept the OAuth redirect.** Sign-in navigates away and comes
  back with query parameters; a worker that serves a cached `index.html` for
  the return URL can swallow them. Let those navigations pass through.

---

## Every credential, in one table

Each row is something only a human with a login can create. They are on the
[Waiting on a human](#what-to-build-in-order) list.

| Credential | Where it is created | Where it lives | Notes |
|---|---|---|---|
| Google OAuth **Client ID** | Google Cloud Console → Credentials | Public — in the app's JS | Not a secret. Origins must list every subdomain |
| Google OAuth **Client Secret** | same | `fly secrets` | Not needed for ID-token-only verification; do not ship it |
| Apple **Team ID** | Apple Developer account | `fly secrets` | Ten characters, on the membership page |
| Apple **Services ID** | Developer → Identifiers → Services IDs | `fly secrets` + app JS | Acts as `client_id`/`aud`. **Not** the App ID |
| Apple **Key ID** + **`.p8` private key** | Developer → Keys → new key, Sign In With Apple | `fly secrets` (paste the PEM) | **Downloadable exactly once.** Lose it and you make a new key |
| Apple domain association file | Developer → Services ID → domains | `/.well-known/` in each app repo | Per domain; must serve as plain text, no redirect |
| Stripe **secret key** (test + live) | Stripe dashboard → API keys | `fly secrets` | Never in the browser. Two separate worlds |
| Stripe **publishable key** | same | Public, only if using Stripe.js | Checkout redirect does not need it |
| Stripe **webhook signing secret** | Stripe → Webhooks → endpoint | `fly secrets` | Per endpoint. Test and live differ |
| Stripe **Price id**, one per app | Stripe → Products | Server config or `products` table | Never client-side |
| **Database URL** | Postgres provider | `fly secrets` | Rotate if it is ever pasted anywhere |
| **Session signing secret** | `openssl rand -base64 32` | `fly secrets` | Rotating it signs everyone out — acceptable, but know it |
| Fly.io **deploy token** | Fly dashboard | CI secret, if deploying from CI | Scope to the one app |

**Nothing in this table goes in a repo, a `fly.toml`, a commit message, or a
screenshot.** The apps are public; GameHub is a real repository. One Stripe
secret key in git history is a rotation and an incident, and the `.p8` is
worse because it cannot be re-downloaded.

---

## Recurring costs

Rough, and worth knowing before committing to the model, because a $5 app that
costs $30/month to keep up has to sell six copies a month to break even.

| | Cost | Notes |
|---|---|---|
| Apple Developer Program | **$99/year** | Mandatory for Sign in with Apple. The one unavoidable fixed cost |
| Domain | ~$10–20/year | Already paid; shared across every app |
| Fly.io | **~$2–10/month** | One small machine kept warm. Scale-to-zero is cheaper and worse |
| Postgres | **$0–20/month** | Free tiers exist and are ample for these tables |
| Stripe | **~2.9% + $0.30 per transaction** | On $5 that is roughly **$0.45**, about 9% — one-off pricing pays this once, which is the argument for $5 rather than $1 |
| Cloudflare Pages | $0 | Static hosting stays free |
| Google Cloud | $0 | Sign-in only; no billable APIs |
| **Floor** | **≈ $12–20/month all in** | Shared across every app, not per app — which is the payoff of one shared service |

*These are order-of-magnitude figures from general knowledge, not quotes.
Stripe's percentage in particular varies by country and card type. Check
current pricing before relying on any of it.*

Note the shape: the costs are almost entirely **fixed and shared**, so the
second app is nearly free to monetise and the tenth is free. That is the
financial argument for the single-service decision, on top of the engineering
one.

---

## The traps, collected

The ones that produce a wrong result rather than an error. Everything here is
written out in full above; this is the list to re-read before you ship.

1. **Granting the entitlement on the success URL** instead of the webhook.
   The product is free to anyone who reads the URL.
2. **A JSON body parser in front of the Stripe webhook route.** Signature
   verification fails on a valid request.
3. **Apple's client secret expiring at six months.** Sign-in dies for
   everyone, months after the code was written and forgotten.
4. **Not storing Apple's name on the first authorization.** Gone forever.
5. **Auto-linking accounts by email.** Apple Private Relay makes it wrong; it
   is also a takeover vector.
6. **Keying accounts on email rather than `sub`.** Same, worse.
7. **A cached entitlement that expires into "unpaid" offline.** A paying
   customer loses the product on a plane and concludes you took the money.
8. **CSP missing `frame-src`.** The button silently does nothing.
9. **CORS `Allow-Origin: *` with credentials**, or reflecting `Origin`. One
   is broken, the other is a vulnerability.
10. **A test Stripe key in production.** Purchases "succeed" and charge
    nobody.
11. **The service worker serving `index.html` for a 401.** The real cause
    never appears anywhere.
12. **Unmanaged Postgres with no tested restore.** The data is "who paid
    you".
13. **A Google consent screen left in Testing mode.** Only your own accounts
    can sign in; everyone else gets a generic error.
14. **Loading the Google/Apple/Stripe scripts in `<head>`.** Every free user
    who never signs in now makes third-party requests, which is the thing
    Rule 7 exists to prevent.

---

## What to build, in order

Nothing here is blocked on the apps. Everything is blocked on step 0.

**0. Waiting on a human — start these now, they have lead times.**

- [ ] **Enrol in the Apple Developer Program.** $99/year, identity
      verification, not instant. Every Apple step below is blocked on it and
      the waiting is the long pole. *Agent cannot: payment and identity.*
- [ ] **Create the Google Cloud project, OAuth client and consent screen.**
      Publish the consent screen — in Testing mode only listed accounts can
      sign in, and everyone else sees an error that does not say why. Add
      every app subdomain, plus the localhost port, as authorized origins.
      *Agent cannot: console login.*
- [ ] **Create the Stripe account** and activate it (bank details, identity).
      Then one Product per app, one Price each at $5. *Agent cannot:
      financial identity.*
- [ ] **Decide the VAT/sales-tax position** on digital goods, and whether to
      turn on Stripe Tax. *Agent cannot: this is a decision with legal
      consequences.*
- [ ] **Decide the free/paid line for each app**, per
      [Drawing the free/paid line](#drawing-the-freepaid-line). *Agent cannot:
      it is a taste and product judgement.*
- [ ] **Choose and create the Postgres host**, and verify one restore from a
      backup actually works. *Agent cannot: account creation; and the restore
      is a judgement about whether the result is right.*

**1. The service, smallest first.** `/healthz`, Postgres, the schema above.
Deploy to Fly. Nothing else.

**2. Google sign-in end to end** — token verification, user upsert, session
cookie, `/v1/me`. One app wired to it. Get the CORS and cookie behaviour right
here, once, while there is only one moving part.

**3. Stripe** — `/v1/checkout`, the webhook, the entitlement write, refund
revocation. Develop against `stripe listen`. Do not touch live keys until the
test flow has worked end to end including a refund.

**4. The client half, in the kit** — `js/account.js` (sign-in, `/v1/me`, the
cached entitlement with the asymmetry above) and the Settings UI. Put it in
[`starter-kit/`](./starter-kit/) so app #7 gets it free, which is the same
reasoning that produced `js/install.js`.

**5. Apple sign-in.** Last, on a working system, so the five traps above are
the only unknowns in the room.

**6. Retrofit the existing apps** one at a time, easiest first.

**7. Extend the smoke test.** Three assertions, and they must be able to fail
(Rule 12): the app boots and is fully usable with the API origin blocked; a
cached paid entitlement survives the API being unreachable; and the free tier
can still export. Block the origin in the test and watch each one go red
before you trust it.
