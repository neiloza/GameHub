# Setting up accounts — every step, in order

One sign-in at `thewizardofoza.com` that covers every app on the domain.
**Google sign-in and email + password with recovery.** Apple is deliberately
out of scope for now.

**Do these in order** — later steps need values earlier ones produce. Where a
step has a trap, it is marked **Trap:** — those produce a wrong result rather
than an error, so they cost an afternoon rather than a minute.

Budget about two hours for steps 1–8. Step 9 (email deliverability) has DNS
propagation in it, which is out of your hands.

## How it works, in one picture

```
  wander.thewizardofoza.com  ─┐
  popcorn.thewizardofoza.com ─┤   fetch(credentials:"include")
  forest.thewizardofoza.com  ─┼──────────────►  api.thewizardofoza.com
  …every future app          ─┘                 (Fly.io) ──► Postgres
                                                     │
                              Set-Cookie: woz_session; Domain=.thewizardofoza.com
                                          HttpOnly; Secure; SameSite=Lax
```

**The cookie is the whole mechanism.** It is scoped to the *parent* domain, so
every subdomain sends it — sign in on one app and the rest are already signed
in. It is **HttpOnly**, so no app's JavaScript ever touches the token: an XSS
in one app cannot steal the session for the others. That property is the main
reason this runs on our own API rather than calling a hosted auth service from
the browser.

## Contents

1. [Postgres](#1-postgres)
2. [The Fly app](#2-the-fly-app)
3. [Google sign-in](#3-google-sign-in)
4. [Secrets](#4-secrets)
5. [DNS](#5-dns)
6. [Deploy and migrate](#6-deploy-and-migrate)
7. [Stripe](#7-stripe)
8. [Wire up an app](#8-wire-up-an-app)
9. [Email deliverability](#9-email-deliverability--do-not-skip-this)
10. [Verify it actually works](#10-verify-it-actually-works)
11. [Values to keep](#values-to-keep)

---

## 1. Postgres

Any Postgres works. The tables are tiny and the load is a handful of writes per
sign-in — this is not a scaling problem and should not be designed as one.

**Trap, and it matters:** Fly's *unmanaged* Postgres — the one `fly launch`
historically offers to create for you — is **not a managed database**. It is
Postgres on a Fly volume, and you own backups, upgrades and failover. If the
volume is lost, the data is lost. Fly's own docs have long been explicit about
this. The data here is *who paid you*, which cannot be reconstructed from
anything but Stripe's records and a bad afternoon.

So pick one of:

- **Fly Managed Postgres** — stays inside Fly, private networking, Fly handles
  backups.
- **Neon** or **Supabase Postgres** — managed, generous free tiers, one
  connection string. (Using Supabase *purely as a database* is fine and is not
  the same as using Supabase Auth.)
- **Fly unmanaged Postgres** — only if you will genuinely configure and test
  backups yourself.

*Confidence note: product names and free-tier limits in this area move every
few months. Check current docs before choosing; the unmanaged-vs-managed
caveat is the durable part.*

Whatever you choose: **turn on automated daily backups, and restore one once**
to prove it works. An untested backup is a belief, not a backup.

Keep the connection string. It looks like
`postgres://user:pass@host:5432/dbname`.

---

## 2. The Fly app

From `setup/accounts/service/`:

```bash
fly auth login
fly launch --no-deploy        # answers below
```

- App name: `woz-accounts`
- Region: nearest you (`fly.toml` says `iad` — change it)
- **Decline** the offer to create a Postgres or Redis; you did step 1 already.
- **Decline** the offer to deploy now.

`fly launch` may rewrite `fly.toml`. Check afterwards that
`min_machines_running` is still **1**.

**Trap:** `auto_stop_machines` with `min_machines_running = 0` saves a few
dollars a month and costs a cold start on the first request. For the Stripe
webhook that is fine — Stripe retries. For somebody tapping **Sign in** it is a
two-to-three second stall on the most abandonment-prone screen in the app, and
it reads as "broken", not as "asleep".

---

## 3. Google sign-in

You have a Google **Workspace** (business) account, which changes one answer
below. Read 3.3 carefully — it is the likeliest thing in this document to go
wrong.

### 3.1 Project

<https://console.cloud.google.com> → **New project**, named `wizardofoza`. One
project for every app, not one per app.

### 3.2 Consent screen

**APIs & Services → OAuth consent screen.**

### 3.3 ⚠️ Choose **External**, not Internal

Because your account is Workspace, Google offers **Internal** and it looks like
the sensible choice. **Internal means only people with an `@yourdomain` address
can sign in.** Every ordinary customer with a Gmail address gets a generic
error, and nothing in your dashboard flags it.

Choose **External**.

Fill in the app name (what users see on the consent screen), your support
email, and authorised domain `thewizardofoza.com`.

**Scopes:** `openid`, `email`, `profile`. Nothing else. These are
non-sensitive, so no Google security review is needed. Anything more triggers a
verification process that takes weeks.

### 3.4 Publish it

Click **Publish app** so the status is **In production**.

**Trap:** in **Testing**, only accounts you explicitly listed can sign in —
capped at 100 — and everyone else sees an error that does not say why. With
only non-sensitive scopes, publishing is a form, not an audit. But it is a
manual click and it is easy to leave undone.

### 3.5 The OAuth client

**Credentials → Create credentials → OAuth client ID → Web application.**

- **Authorised JavaScript origins:** leave empty. Nothing is needed — the
  browser never talks to Google directly, so no Google script runs in your
  pages and a free user who never signs in makes **zero** third-party
  requests.
- **Authorised redirect URIs:** exactly one:

  ```
  https://api.thewizardofoza.com/v1/auth/google/callback
  ```

**That single entry is the payoff of the server-side flow.** Talking to Google
from each app would mean adding every app's origin here as you launch it, and
discovering you forgot on launch day.

Copy the **Client ID** and **Client secret**.

---

## 4. Secrets

Everything sensitive goes in `fly secrets`, which injects environment variables
at runtime and puts nothing in the image. `fly.toml` is committed and contains
no secrets.

```bash
fly secrets set \
  DATABASE_URL='postgres://…' \
  GOOGLE_CLIENT_ID='…apps.googleusercontent.com' \
  GOOGLE_CLIENT_SECRET='…' \
  RESEND_API_KEY='re_…' \
  MAIL_FROM='The Wizard of Oza <no-reply@thewizardofoza.com>'
```

Stripe's secrets come in step 7.

The non-secret configuration is already in `fly.toml`: `SITE_URL`, `API_URL`,
`COOKIE_DOMAIN`, `ALLOWED_ORIGIN_SUFFIX`. If your domain is not
`thewizardofoza.com`, change all four there.

---

## 5. DNS

At your registrar, point `api` at the Fly app:

```bash
fly ips allocate-v4
fly ips allocate-v6
```

Then add the records Fly prints — an **A** record for `api` to the IPv4 and an
**AAAA** to the IPv6. Then:

```bash
fly certs add api.thewizardofoza.com
fly certs show api.thewizardofoza.com     # wait for it to say "Ready"
```

**Do not move the domain's nameservers.** Other apps share this domain; adding
a subdomain must stay a record change that touches nothing else.

**Trap:** the session cookie is `Secure`, so it will not be set at all over
plain HTTP. Until the certificate says Ready, sign-in will appear to succeed
and then immediately forget you.

---

## 6. Deploy and migrate

```bash
fly deploy
fly logs                                    # expect "accounts service listening"

# Apply the schema. Run it from anywhere that can reach the database.
DATABASE_URL='postgres://…' npm run migrate
```

The migration runner is idempotent — it records what it has applied, so
re-running it is safe.

Check it is alive:

```bash
curl -s https://api.thewizardofoza.com/healthz
# {"ok":true}
```

`/healthz` queries the database rather than just returning 200. A service that
reports healthy while Postgres is unreachable reports healthy through the
entire outage.

---

## 7. Stripe

### 7.1 Account

<https://dashboard.stripe.com> → create and activate it (business details,
bank account, identity). Until activation completes you are in test mode, which
is fine for everything before launch.

### 7.2 One Product per app

**Products → Add product.** Per app: name it after the app, one price, **One
time** (not recurring), $5.00.

Copy each **Price ID** (`price_…`).

**Trap:** test and live are **separate worlds** — separate products, price IDs,
keys, webhooks and signing secrets. Do this twice and keep them apart. A live
key with a test price ID fails with "no such price", which reads exactly like a
typo.

### 7.3 The webhook

**Developers → Webhooks → Add endpoint.**

- URL: `https://api.thewizardofoza.com/v1/stripe/webhook`
- Events: `checkout.session.completed`, `charge.refunded`,
  `charge.dispute.created`

Copy the **Signing secret** (`whsec_…`).

### 7.4 Secrets

```bash
fly secrets set \
  STRIPE_SECRET_KEY='sk_test_…' \
  STRIPE_WEBHOOK_SECRET='whsec_…' \
  APP_PRICES='{"wander":"price_xxx","popcorn":"price_yyy"}'
```

`APP_PRICES` maps app slug → price ID **on the server**. The browser sends only
a slug: a client that can name the amount is a client that can name fifty
cents. One env var rather than one per app, so launching an app is a secret
update rather than a code change.

**Trap:** the **webhook** grants the purchase. The **success URL never does** —
it is a string anyone can type into the address bar. If the grant lived there,
every app would be free to anybody who looked once.

---

## 8. Wire up an app

In the app's `js/app.js`:

```js
import { createAccount } from "./js/account.js";

export const account = createAccount({
  apiUrl:  "https://api.thewizardofoza.com",
  appSlug: "wander",                       // must match the APP_PRICES key
});

const { recoveryToken, purchase, error } = await account.init();
if (error)         showToast("Sign-in failed. Please try again.");
if (recoveryToken) openSetPasswordSheet(recoveryToken);
if (purchase === "done") account.refresh().then(() => showToast("Unlocked. Thank you!"));
```

Then add to the app's `_headers`:

```
connect-src 'self' https://api.thewizardofoza.com
```

**Trap:** without that directive everything works locally and every sign-in
fails in production, silently, with nothing in the page console. This exact
shape of bug cost this estate thirteen debugging rounds on a different feature
— see [`../LESSONS.md`](../LESSONS.md) 1.6 and 1.7. **Check the CSP in a real
browser with the console open** rather than trusting the line above, which is
written from reasoning.

Note there is no `script-src` entry for Google: the browser never loads a
Google script, so there is nothing to allow.

---

## 9. Email deliverability — do not skip this

A password reset that silently lands in spam is indistinguishable, from the
user's side, from one that was never sent — and you will not reproduce it,
because your own mail arrives.

1. Create an account at **Resend** (what `mail.js` speaks; swapping provider
   means changing one function).
2. Verify `thewizardofoza.com` as a sending domain — this means **SPF** and
   **DKIM** records at your registrar. Allow propagation time.
3. `fly secrets set RESEND_API_KEY='re_…'`

**Test to addresses you have never mailed before** — a fresh Gmail *and* a
fresh iCloud. Your own inbox is not a test; it already trusts you.

Until `RESEND_API_KEY` is set, reset emails are **printed to `fly logs`**
rather than silently dropped, so the flow is testable before the domain is
verified.

---

## 10. Verify it actually works

Nothing in this system has run against a real deployment. The service was
written in a sandbox with no network route out, which is exactly the situation
[`../LESSONS.md`](../LESSONS.md) P5 warns about. **Verify rather than assume.**

```bash
# the service, hop by hop
node setup/accounts/verify.mjs \
  --api https://api.thewizardofoza.com \
  --origin https://wander.thewizardofoza.com

# and with a real account, end to end
node setup/accounts/verify.mjs --api … --email you@example.com --password '…'
```

It checks that CORS allows your apps *and refuses an unrelated origin*, that
the cookie is HttpOnly and scoped to the parent domain, that Google redirects,
and that the reset endpoint answers identically for a real and an unknown
address.

Then, by hand — **these are the ones only a browser can settle:**

- [ ] **Sign in on one app. Open a different app on the domain.** You should
      already be signed in. *That is the whole feature.* If it fails, look at
      the cookie in devtools: its `Domain` must be `.thewizardofoza.com`, not
      one app's host.
- [ ] **Sign up with email and password**, sign out, sign back in.
- [ ] **Forgot password, end to end**, to an address you have never mailed.
      Check it is not in spam. Click the link, set a new password, confirm you
      end up signed in.
- [ ] **Use the same reset link twice.** The second time must fail.
- [ ] **Reset while signed in on another device.** The other device must be
      signed out — the usual reason somebody resets is believing that someone
      else is in their account.
- [ ] **Ask to reset a Google-only account.** You should get the email saying
      it signs in with Google, *not* a reset link and not silence.
- [ ] **Buy something in Stripe test mode** (`4242 4242 4242 4242`). Confirm
      the `entitlements` row appears. Then refund it in Stripe and confirm the
      row flips to `refunded`.
- [ ] **Turn off the network and open an app.** It must still work, and a
      previously-paid user must still be paid. The cached entitlement never
      expires into "unpaid".

---

## Values to keep

Password manager, not a repo.

| Value | Where it goes | Secret |
|---|---|---|
| `DATABASE_URL` | `fly secrets` | **yes** |
| Google Client ID | `fly secrets` | no, but keep it tidy |
| Google Client secret | `fly secrets` | **yes** |
| Stripe secret key (test + live) | `fly secrets` | **yes** |
| Stripe webhook signing secret | `fly secrets` | **yes** |
| Stripe Price IDs | `APP_PRICES` | no |
| `RESEND_API_KEY` | `fly secrets` | **yes** |
| Fly deploy token (if CI deploys) | CI secret | **yes** |

**Nothing in the "yes" column goes in a repo, a commit message, or a
screenshot.** GameHub is a real repository; one leaked Stripe key is a rotation
and an incident.

---

## When something breaks

In this order:

1. **`node setup/accounts/verify.mjs --api …`** — it names the hop.
2. **On a phone, `account.diagnose()`** and read the report. Every line it
   prints feeds its verdict, so it cannot tell you things are fine while a hop
   is red.
3. **`fly logs`** — the service logs the real reason for a Google exchange
   failure and a webhook failure.
4. **"Works locally, fails deployed" is almost always `connect-src`** (step 8)
   or CORS (`ALLOWED_ORIGIN_SUFFIX`).
5. **"Signs in and immediately forgets me"** is almost always the cookie: no
   HTTPS certificate yet, or `COOKIE_DOMAIN` not set to the parent domain.
6. Only then suspect the code.
