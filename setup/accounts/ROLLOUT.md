# Rolling sign-in out to thewizardofoza.com and every app

**Read [`SETUP.md`](./SETUP.md) first and finish it.** This file assumes the
service is deployed at `api.thewizardofoza.com`, Google is configured, and
`verify.mjs` passes. Nothing below works until that is true.

This is the per-property work: the apex site, then each app, then the checks
that prove the single sign-on actually happened.

## Contents

- [The order to do this in](#the-order-to-do-this-in)
- [Every app needs the same six things](#every-app-needs-the-same-six-things)
- [A: the apex — thewizardofoza.com](#a-the-apex--thewizardofozacom)
- [B: an app scaffolded from the kit](#b-an-app-scaffolded-from-the-kit)
- [C: an existing app (Wander, Popcorn, Forest…)](#c-an-existing-app-wander-popcorn-forest)
- [Per-app checklist](#per-app-checklist)
- [Proving the SSO actually works](#proving-the-sso-actually-works)
- [When it does not work](#when-it-does-not-work)

---

## The order to do this in

**One app at a time, and the apex first.** The apex is the simplest property
and the one where a mistake is cheapest — get the cookie, CORS and CSP right
there, once, then repeat a known-good recipe.

1. **The apex** (`thewizardofoza.com`). Sign-in only, no purchase.
2. **One app you do not mind breaking.** Prove SSO between it and the apex.
   **Stop here and actually check it** — everything after this is repetition,
   and repeating a mistake nine times is the expensive failure mode.
3. **The rest**, easiest first.

Do not do all of them in one sitting. Each one is a deploy that can be wrong
in production only, and you want the first report of a problem to be about one
app rather than ten.

---

## Every app needs the same six things

Whatever the app is built on, the work is identical:

| # | Thing | Why it bites |
|---|---|---|
| 1 | `js/account.js` + `js/account-ui.js` + `css/account.css` | The client |
| 2 | An `#account-sheet` overlay in the HTML | The UI needs somewhere to render |
| 3 | `account.init()` in the boot path, **not awaited** | An awaited auth call can stop an offline-first app booting |
| 4 | `connect-src https://api.thewizardofoza.com` in `_headers` | **Missing = works locally, every sign-in fails in production, silently** |
| 5 | The three new files in the worker's `SHELL` | Missing = works until someone installs it and opens it on a plane |
| 6 | The app's origin on the service's allow-list | Already covered by `ALLOWED_ORIGIN_SUFFIX`, unless the app is off-domain |

**Number 4 is the one that will get you.** There is no console message, no
violation event in the page, and every local test passes. It is the same shape
as the bug that cost thirteen debugging rounds in
[`../LESSONS.md`](../LESSONS.md) 1.6.

---

## A: the apex — thewizardofoza.com

The apex is where people will expect to sign in, and it needs no purchase
flow, so it is the smallest version of the job.

**If the apex is currently GameHub's static hub page**, add to it:

```html
<link rel="stylesheet" href="./css/account.css">

<div class="overlay" id="account-sheet" hidden>
  <div class="overlay-backdrop" data-sheet-close></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="account-title">
    <div class="sheet-head">
      <h2 class="sheet-title" id="account-title">Account</h2>
      <button class="icon-btn" data-sheet-close aria-label="Close">✕</button>
    </div>
    <div class="sheet-body" id="account-body"></div>
  </div>
</div>
```

```js
import { createAccount }  from "./js/account.js";
import { initAccountUI }  from "./js/account-ui.js";

const account = createAccount({
  apiUrl:  "https://api.thewizardofoza.com",
  appSlug: "hub",          // nothing is sold here; the slug is just a label
});

const ui = initAccountUI(account, { appName: "The Wizard of Oza" });
document.getElementById("account-btn").addEventListener("click", () => ui.open());

account.init().then(({ recoveryToken, error }) => {
  if (recoveryToken) ui.openReset(recoveryToken);
  if (error) console.warn("sign-in did not complete");
});
```

Copy `js/account.js`, `js/account-ui.js` and `css/account.css` from
[`../starter-kit/`](../starter-kit/). The apex needs `ui.js` too (for
`openSheet`/`closeSheet`/`toast`) — take it from the kit as well, or replace
those three calls with your own.

**Make the apex the reset destination.** In the service, `SITE_URL` is where a
reset link goes when an app did not name one. Pointing it at the apex means a
recovery link always lands somewhere that can handle it.

---

## B: an app scaffolded from the kit

**Already done.** The kit ships all six things wired up. A new app needs only:

1. Set `appSlug` in `js/app.js` to match the key in the service's
   `APP_PRICES`. If they disagree, checkout answers *"no price configured"*.
2. Add the price to `APP_PRICES` and redeploy the service:
   ```bash
   fly secrets set APP_PRICES='{"wander":"price_xxx","newapp":"price_zzz"}'
   ```
   It is **one variable holding all apps** — set the whole map, not just the
   new entry, or you will delete the others.
3. Add the `connect-src` line to the app's `_headers` (the kit has no
   `_headers` of its own; see the snippet in section C).

To build an app **without** accounts, delete `js/account.js`,
`js/account-ui.js`, `css/account.css`, the `#account-sheet` block, the
`#account-btn`, the account lines in `js/app.js`, and their entries in
`sw.js`.

---

## C: an existing app (Wander, Popcorn, Forest…)

These were not scaffolded from the kit, so this is a real but small port.

**1. Copy three files in**, from `setup/starter-kit/`:

```
js/account.js  js/account-ui.js  css/account.css
```

`account-ui.js` imports `openSheet`, `closeSheet` and `toast` from `./ui.js`.
Wander has those. If an app does not, either copy the kit's `ui.js` or swap
those three imports for the app's own equivalents — they are the only coupling.

**2. Add the overlay** — the HTML block from section A.

**3. Boot it**, alongside the app's existing init:

```js
const account = createAccount({
  apiUrl:  "https://api.thewizardofoza.com",
  appSlug: "wander",
});
const accountUI = initAccountUI(account, { appName: "Wander" });

account.init().then(({ recoveryToken, purchase }) => {
  if (recoveryToken) accountUI.openReset(recoveryToken);
  if (purchase === "done") account.refresh().then(() => toast("Unlocked. Thank you!"));
});
```

**Do not `await` it.** Wander deals a deck from a shipped catalog with no
network; making that wait on an auth call would undo the property the whole
app is built around.

**4. The CSP.** In the app's `_headers`, add the API to `connect-src` —
alongside whatever is already there, not replacing it:

```
Content-Security-Policy: ... connect-src 'self' https://api.thewizardofoza.com https://en.wikipedia.org https://commons.wikimedia.org https://upload.wikimedia.org; ...
```

No `script-src` entry is needed for Google: the browser never loads a Google
script, because sign-in is a redirect to our own API.

**5. The service worker.** Add the three files to `SHELL` and **bump
`CACHE`** — a change to the shell *list* needs the cache name bumped, or
existing installs keep the old list.

Also make sure the worker does not intercept the API. Wander's worker is
same-origin only, so it already does not. If yours has a catch-all, exclude
`api.thewizardofoza.com`: an authenticated response must never land in a
shared cache, and an `index.html` fallback served for a 401 turns an expired
session into a JSON parse error that names nothing.

**6. Where to put the button.** Wander has a Settings sheet — add an
**Account** row there rather than a new topbar button, which would cost
toolbar width the deck's height is computed from.

**7. Decide the free/paid line** and write it into the app's `CLAUDE.md`
under Invariants. Per [`../APP_DESIGN_RULES.md`](../APP_DESIGN_RULES.md) rule
7: the free version stays complete, **export is never gated**, and nothing
that shipped free is taken back.

---

## Per-app checklist

Copy this into the app's `CLAUDE.md` as you go.

```
[ ] account.js, account-ui.js, account.css copied in
[ ] #account-sheet overlay in the HTML
[ ] account.init() in the boot path, NOT awaited
[ ] a way to open the sheet (topbar button or a Settings row)
[ ] appSlug matches the key in the service's APP_PRICES
[ ] the app's price added to APP_PRICES (whole map re-set, not just the new key)
[ ] connect-src https://api.thewizardofoza.com in _headers
[ ] all three files in the worker's SHELL, and CACHE bumped
[ ] the worker does not cache or fall back for api.thewizardofoza.com
[ ] free/paid line decided and written into CLAUDE.md
[ ] smoke test still green with the API blocked
```

---

## Proving the SSO actually works

`verify.mjs` proves the service. **It cannot prove the feature** — that takes
a browser and two subdomains.

Do this after the apex and the first app, before doing any others:

1. **Sign in at `thewizardofoza.com`.**
2. **Open `wander.thewizardofoza.com` in the same browser.** Tap Account.
   **You should already be signed in.** If you are, the whole design works and
   the rest is repetition.
3. **Check the cookie.** Devtools → Application → Cookies. There should be
   exactly one `woz_session`, with:
   - `Domain` = `.thewizardofoza.com` — **with the leading dot.** A cookie
     scoped to a single host is the number-one reason this fails.
   - `HttpOnly` ✓ and `Secure` ✓
4. **Sign out on one app, reload the other.** You should be signed out there
   too.
5. **Turn the network off and reload an app.** It must still work. A paid user
   must still be paid — the cached entitlement never expires into "unpaid".
6. **Open a private window.** You should be signed out — proving you were
   reading a real session, not a cache.

---

## When it does not work

In this order. Each row is a distinct cause with a distinct fix, and they are
easy to mistake for one another.

| Symptom | Almost always |
|---|---|
| Sign-in succeeds, then instantly forgotten | `COOKIE_DOMAIN` wrong for the environment, or no HTTPS certificate yet — a `Secure` cookie is not stored over plain HTTP |
| Signed in on one app, not another | The cookie has no leading-dot `Domain`; or the second app is on a different registrable domain |
| Every call 401s, cookie visible in devtools | CORS: `Access-Control-Allow-Credentials` missing, or the origin is not on the allow-list. Both halves are needed |
| Works locally, fails deployed, nothing in the console | `connect-src`. Every time |
| The Account button does nothing | A JS error before the listener attached — check the console, and check `ui.js` is present |
| Reset link lands on the wrong site | `SITE_URL`, or the app passed no `return_to` |
| Reset email never arrives | SPF/DKIM not verified. Check spam; test to an address you have never mailed |
| "no price configured" at checkout | `appSlug` and the `APP_PRICES` key disagree |
| Google says `redirect_uri_mismatch` | The Google console must have `https://api.thewizardofoza.com/v1/auth/google/callback`, exactly |
| Only your own accounts can sign in | The Google consent screen is still in **Testing**, or was set to **Internal** |

Then: `node setup/accounts/verify.mjs --api … --origin https://theapp.thewizardofoza.com`,
which checks CORS *as that specific app*. And on a phone,
`account.diagnose()` — it walks every hop and prints a verdict that cannot
contradict its own lines.
