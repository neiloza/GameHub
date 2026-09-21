# accounts — one sign-in for every app

**Status: runs, but has never met Google, Stripe or DNS.** The service has
been exercised end to end against a real Postgres — signup, sign-in, reset,
single-use links, session invalidation, entitlements, sign-out — and that
found three real bugs, now fixed. What remains unproven is everything needing
a credential or a browser. See
[Before you trust any of this](#before-you-trust-any-of-this).

One account at `thewizardofoza.com` covering every app on the domain. Google
sign-in and email + password with recovery. A one-time $5 unlock per app.
Apple sign-in is deliberately out of scope for now.

**Start at [`SETUP.md`](./SETUP.md)** — every step, in order, with the traps
marked. Its **step 0 rehearses the whole thing locally** in five minutes with
no accounts and no credentials; do that before touching a dashboard.

Then [`ROLLOUT.md`](./ROLLOUT.md) — putting sign-in on the apex and on every
app, and the browser checks that prove the single sign-on actually happened.

## How the single sign-on works

```
  wander.thewizardofoza.com  ─┐
  popcorn.thewizardofoza.com ─┤   fetch(credentials:"include")
  forest.thewizardofoza.com  ─┼──────────────►  api.thewizardofoza.com
  …every future app          ─┘                 (Fly.io) ──► Postgres
                                                     │
                              Set-Cookie: woz_session; Domain=.thewizardofoza.com
                                          HttpOnly; Secure; SameSite=Lax
```

**One cookie, scoped to the parent domain.** Every subdomain sends it, so
signing in on any app signs you in on all of them. That is the entire
mechanism — there is no token exchange, no per-app login, nothing to
synchronise.

Three properties worth understanding before changing anything:

- **HttpOnly.** No app's JavaScript ever reads the token, so an XSS in one app
  cannot steal the session for the others. This is the main security argument
  for running our own API instead of calling a hosted auth service from the
  browser, where the token must be readable. Do not move it into
  `localStorage` to make it easier to inspect.
- **`SameSite=Lax` is sufficient** even though app→API is cross-*origin*,
  because SameSite is evaluated per *site* (registrable domain). It still
  needs CORS with credentials, and having one of those two halves without the
  other produces a 401 that looks like an auth bug and is a header bug.
- **The origin allow-list is the security boundary.** It is echoed from a
  list, never reflected. Reflecting `Origin` would let any site make
  credentialed requests as your signed-in user.

## What is here

| Path | What it is |
|---|---|
| [`SETUP.md`](./SETUP.md) | **Start here.** Postgres, Fly, Google, Stripe, DNS, email |
| `service/src/index.js` | The API: routes, Google flow, password flows, Stripe |
| `service/src/auth.js` | Passwords, tokens, the cookie, the origin allow-list |
| `service/src/db.js` | Pool, transactions, identity upsert |
| `service/src/mail.js` | Reset emails (Resend over plain `fetch`) |
| `service/migrations/` | The schema |
| `service/test/` | Tests for the security boundary — **no network needed** |
| `service/fly.toml`, `Dockerfile` | Deployment. No secrets; those are `fly secrets` |
| [`ROLLOUT.md`](./ROLLOUT.md) | Putting sign-in on the apex and every app |
| [`verify.mjs`](./verify.mjs) | Checks a **deployed** service hop by hop |
| `../starter-kit/js/account.js` | The client the apps use |
| `../starter-kit/js/account-ui.js` | The sign-in sheet every app shares |

The service is the **one place in this estate with runtime dependencies** —
`pg`, `stripe`, `google-auth-library`. The apps stay static with none. Every
package added here is one more thing to patch on a service that holds who paid
you, so keep the list short.

## Decisions worth knowing

- **Accounts are keyed on provider `sub`, never on email.** Email addresses
  change and get reassigned; an account keyed on email is an account-takeover
  waiting for somebody to notice.
- **Accounts are never auto-linked by matching email.** "This email matches" is
  a claim from a third party. The consequence is real and must be handled in
  the UI: somebody who bought with Google and later signs up with a password
  sees the free version. Mitigations are a visible **Restore purchases**,
  showing which method is signed in, and `source = 'manual'` on entitlements as
  the recovery path — the Stripe receipt is the evidence, and it lives outside
  this database.
- **Google uses the server-side code flow**, so no Google script runs in any
  page: a free user who never signs in makes **zero** third-party requests,
  which is the property house rule 7 exists to protect. It also means exactly
  **one** redirect URI is registered with Google, ever.
- **The reset form answers identically for a real and an unknown address.**
  "No account with that email" is an account-enumeration oracle. A Google-only
  account is told it signs in with Google *in the email*, where only the
  account holder can read it.
- **A reset invalidates every other session.** The usual reason somebody
  resets is believing that someone else is in their account.
- **The Stripe webhook grants the entitlement; the success URL never does.**
- **A cached entitlement never expires into "unpaid".** "Could not reach the
  server" and "has not paid" arrive looking identical, and persisting the wrong
  one downgrades a paying customer on a train.
- **The server names the price.** The browser sends an app slug and nothing
  else.
- **No app content is stored server-side.** Saved places, trips, decks and
  scores stay on the device (house rule 5). Signing in is not a backup, and
  Settings has to say so.

## Before you trust any of this

The service has now been **run** — Postgres installed locally, migration
applied, every flow driven end to end. That found three bugs that no unit test
could have: a migration that would not apply at all, a signup that threw 500
on every request, and a cookie shape that silently breaks local development.
All three are fixed and covered.

But fly.io, Docker Hub and Stripe are unreachable from the sandbox (403 on
CONNECT), so Google sign-in, Stripe and DNS have still never run. So:

- **`service/test/` proves the security boundary only.** Origin allow-list,
  redirect guard, password hashing, cookie shape. All of it is pure logic with
  no network, and each assertion was verified to go red when the thing it
  guards is broken. It tells you nothing about whether the deployment works.
- **`verify.mjs` is what settles the service.** Run it against the real
  deployment. It checks the hops a unit test cannot, including two negative
  cases: that CORS *refuses* an unrelated origin, and that the reset endpoint
  gives identical answers for a known and an unknown address.
- **Only a browser settles the actual feature.** Sign in on one app, open
  another, confirm you are already signed in. `verify.mjs` says so at the end
  rather than letting a green run imply more than it proved.

This is not excessive caution. In this estate a stub written from the same
reasoning as the code once hid a real cause through **twelve consecutive fix
attempts** — see [`../LESSONS.md`](../LESSONS.md) P5. The whole point of the
verifier and the in-app `diagnose()` is that neither can be satisfied by
reasoning.

## Why Fly and Postgres rather than a hosted auth service

Decided 2026-09-21. The game servers are going on Fly anyway, and running two
backends to avoid running one is the worse trade. Two things fell out of it
that are genuine wins rather than consolations: the session cookie can be
**HttpOnly**, which a browser-side auth SDK cannot offer; and the Google
**server-side** flow removes the last third-party script from the apps.

The cost is real and should be stated: password hashing, session management,
reset tokens, rate limiting and email deliverability are now **ours to get
right and keep right**. That is what the tests, the verifier and the traps in
`SETUP.md` are for. `BuyerSellerMarketplace/` in this repo remains a working
reference for the same problems solved on Supabase, and several decisions here
— the enumeration-safe reset, the raw-body webhook, the insert-first
idempotency claim — are lifted straight from it.
