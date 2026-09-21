/*
 * The accounts service for thewizardofoza.com.
 *
 * One API, one database, every app. Sign in on any subdomain and every other
 * subdomain is signed in, because the session cookie is scoped to
 * ".thewizardofoza.com" and set HttpOnly by this service — so no app's
 * JavaScript ever handles a token.
 *
 * Deliberately written on node:http with three dependencies (pg, stripe,
 * google-auth-library). This is the ONE place in the estate where dependencies
 * are allowed (house rule 8, as amended); the apps themselves stay static with
 * none. Keep it that way — every package added here is one more thing to
 * patch on a service that holds who paid you.
 */

import http from "node:http";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import Stripe from "stripe";

import { q, one, tx, upsertIdentity, entitlementsFor, pool } from "./db.js";
import {
  hashPassword, verifyPassword, newToken, hashToken,
  SESSION_COOKIE, SESSION_DAYS, sessionCookie, clearSessionCookie,
  readCookie, isAllowedOrigin, safeReturnTo,
} from "./auth.js";
import { sendPasswordReset } from "./mail.js";

const PORT = Number(process.env.PORT ?? 8080);
const SITE_URL = process.env.SITE_URL ?? "https://thewizardofoza.com";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? ".thewizardofoza.com";
const ORIGIN_SUFFIX = process.env.ALLOWED_ORIGIN_SUFFIX ?? ".thewizardofoza.com";
const ALLOW_LOCALHOST = process.env.ALLOW_LOCALHOST === "1";
const API_URL = process.env.API_URL ?? "https://api.thewizardofoza.com";

const google = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${API_URL}/v1/auth/google/callback`,
});

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" })
  : null;

let APP_PRICES = {};
try {
  APP_PRICES = JSON.parse(process.env.APP_PRICES ?? "{}");
} catch {
  console.error("APP_PRICES is not valid JSON — checkout will refuse every request.");
}

/* -------------------------------------------------------------------------- */

function send(res, status, body, headers = {}) {
  const payload = body === null ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(payload);
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin, { suffix: ORIGIN_SUFFIX, allowLocalhost: ALLOW_LOCALHOST })) {
    // Not on the allow-list: no CORS header at all, so the browser refuses.
    // Vary is still sent, or a cache can hand one app's header to another.
    return { Vary: "Origin" };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    // Without this the cookie is neither sent nor stored, and every
    // authenticated call 401s while the cookie is visibly present in devtools.
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

async function readBody(req, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    // A body with no ceiling is a memory exhaustion away from taking the
    // service down, and none of these endpoints needs more than a few hundred
    // bytes.
    if (size > limit) throw Object.assign(new Error("body too large"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    throw Object.assign(new Error("bad JSON"), { status: 400 });
  }
}

/* --- rate limiting ---------------------------------------------------------
 * In memory, per process. Enough to stop the password and reset endpoints
 * being a free brute-force oracle and a free mailbomb aimed at any address
 * somebody types.
 *
 * Honest limitation, written down rather than discovered: this is per MACHINE.
 * Scale to more than one Fly machine and each gets its own counter, so the
 * effective limit multiplies. For this estate's traffic that is fine; if it
 * stops being fine, move the counter into Postgres rather than adding Redis.
 */
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const bucket = hits.get(key)?.filter((t) => now - t < windowMs) ?? [];
  bucket.push(now);
  hits.set(key, bucket);
  if (hits.size > 10_000) hits.clear();     // crude ceiling; never unbounded
  return bucket.length <= max;
}

function clientIp(req) {
  // Fly sets this. Do not trust it if the service is ever exposed directly.
  return (req.headers["fly-client-ip"] ||
    String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() ||
    req.socket.remoteAddress || "unknown");
}

/* --- sessions -------------------------------------------------------------- */

async function createSession(userId, userAgent) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await q(
    `insert into sessions (token_hash, user_id, expires_at, user_agent)
     values ($1, $2, $3, $4)`,
    [hashToken(token), userId, expires, (userAgent ?? "").slice(0, 300)]
  );
  return token;
}

async function currentUser(req) {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (!token) return null;
  const row = await one(
    `select u.* from sessions s
       join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now() and u.deleted_at is null`,
    [hashToken(token)]
  );
  if (row) {
    // Cheap liveness, not on the critical path — failures are ignored.
    q(`update sessions set last_seen_at = now() where token_hash = $1`, [hashToken(token)])
      .catch(() => {});
  }
  return row;
}

function publicUser(user, entitlements) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.display_name,
      // So the UI can say WHICH method is signed in — the single best
      // mitigation for "I bought this and now it says I have not".
      has_password: !!user.password_hash,
    },
    entitlements,
  };
}

/* --- routes ---------------------------------------------------------------- */

const routes = {
  "GET /healthz": async (req, res) => {
    // Checks the DATABASE, not just that the process is up. A service that
    // answers 200 while Postgres is unreachable reports healthy through the
    // entire outage.
    try {
      await q("select 1");
      send(res, 200, { ok: true });
    } catch (err) {
      send(res, 503, { ok: false, error: err.message });
    }
  },

  "GET /v1/me": async (req, res, cors) => {
    const user = await currentUser(req);
    if (!user) return send(res, 200, { user: null, entitlements: {} }, cors);
    send(res, 200, publicUser(user, await entitlementsFor(user.id)), cors);
  },

  /* --- Google, server-side code flow --------------------------------------
   *
   * The browser never loads a Google script and never handles a token. It is
   * redirected here, we redirect to Google, Google redirects back here, and we
   * set the session cookie and send the user home.
   *
   * Two things this buys over the browser-side ID-token flow:
   *   - A free user who never signs in makes ZERO third-party requests, which
   *     is the property house rule 7 exists to protect.
   *   - ONE redirect URI is registered with Google, ever. Talking to Google
   *     from each app would mean adding every origin as it launches, and
   *     discovering you forgot on launch day.
   */
  "GET /v1/auth/google/start": async (req, res, cors, url) => {
    if (!process.env.GOOGLE_CLIENT_ID) return send(res, 503, { error: "google is not configured" }, cors);
    const returnTo = safeReturnTo(url.searchParams.get("return_to"), {
      suffix: ORIGIN_SUFFIX, siteUrl: SITE_URL, allowLocalhost: ALLOW_LOCALHOST,
    });
    const state = newToken();
    await q(
      `insert into oauth_states (state, return_to, expires_at)
       values ($1, $2, now() + interval '15 minutes')`,
      [state, returnTo]
    );
    const authUrl = google.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      state,
      // No refresh token wanted: we are not calling Google APIs later, only
      // identifying somebody once. Asking for offline access would mean
      // holding a credential we have no use for.
      access_type: "online",
      prompt: "select_account",
    });
    res.writeHead(302, { Location: authUrl });
    res.end();
  },

  "GET /v1/auth/google/callback": async (req, res, cors, url) => {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const failed = (reason) => {
      res.writeHead(302, { Location: `${SITE_URL}/?auth_error=${encodeURIComponent(reason)}` });
      res.end();
    };

    if (!code || !state) return failed("missing_code");

    // Single-use: the delete IS the check, so two deliveries of the same state
    // cannot both succeed.
    const stateRow = await one(
      `delete from oauth_states where state = $1 and expires_at > now() returning return_to`,
      [state]
    );
    if (!stateRow) return failed("state_expired");

    let payload;
    try {
      const { tokens } = await google.getToken(code);
      const ticket = await google.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error("google exchange failed:", err.message);
      return failed("google_exchange_failed");
    }

    // email_verified matters: an unverified address from any provider is a
    // claim, not a fact, and this one ends up on a user row.
    if (!payload?.sub || payload.email_verified === false) return failed("unverified_email");

    const user = await upsertIdentity({
      provider: "google",
      subject: payload.sub,            // stable and immutable — never the email
      email: payload.email,
      displayName: payload.name,
    });

    const token = await createSession(user.id, req.headers["user-agent"]);
    res.writeHead(302, {
      Location: stateRow.return_to,
      "Set-Cookie": sessionCookie(token, { domain: COOKIE_DOMAIN, secure: !ALLOW_LOCALHOST }),
    });
    res.end();
  },

  /* --- email + password ---------------------------------------------------- */

  "POST /v1/auth/signup": async (req, res, cors) => {
    const { email, password } = await readJson(req);
    if (!validEmail(email)) return send(res, 400, { error: "Enter a valid email address." }, cors);
    if (typeof password !== "string" || password.length < 8) {
      return send(res, 400, { error: "Use at least 8 characters." }, cors);
    }
    if (!rateLimit(`signup:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
      return send(res, 429, { error: "Too many attempts. Try again later." }, cors);
    }

    const existing = await one(`select id from users where lower(email::text) = lower($1)`, [email]);
    if (existing) {
      // Do NOT say "that address is taken" — same enumeration oracle as the
      // reset form. Tell them to sign in or reset instead, which is true and
      // actionable either way.
      return send(res, 409, {
        error: "That address already has an account. Sign in, or use “Forgot password”.",
      }, cors);
    }

    const hash = await hashPassword(password);
    const user = await tx(async (client) => {
      const created = await client.query(
        `insert into users (email, password_hash) values ($1, $2) returning *`,
        [email, hash]
      );
      const u = created.rows[0];
      await client.query(
        `insert into identities (provider, subject, user_id, email) values ('password', $1, $1, $2)`,
        [u.id, email]
      );
      return u;
    });

    const token = await createSession(user.id, req.headers["user-agent"]);
    send(res, 200, publicUser(user, {}), {
      ...cors,
      "Set-Cookie": sessionCookie(token, { domain: COOKIE_DOMAIN, secure: !ALLOW_LOCALHOST }),
    });
  },

  "POST /v1/auth/signin": async (req, res, cors) => {
    const { email, password } = await readJson(req);
    if (!validEmail(email) || typeof password !== "string") {
      return send(res, 400, { error: "Enter your email and password." }, cors);
    }
    // Per address AND per IP: one stops a single account being ground down,
    // the other stops a spray across many.
    if (!rateLimit(`signin:${String(email).toLowerCase()}`, 10, 15 * 60 * 1000) ||
        !rateLimit(`signin-ip:${clientIp(req)}`, 50, 15 * 60 * 1000)) {
      return send(res, 429, { error: "Too many attempts. Try again in a few minutes." }, cors);
    }

    const user = await one(
      `select * from users where lower(email::text) = lower($1) and deleted_at is null`, [email]
    );
    // verifyPassword burns comparable time when there is no user and when the
    // account is Google-only, so all three failures look alike from outside.
    const ok = await verifyPassword(password, user?.password_hash ?? null);
    if (!user || !ok) {
      return send(res, 401, { error: "That email and password do not match." }, cors);
    }

    const token = await createSession(user.id, req.headers["user-agent"]);
    send(res, 200, publicUser(user, await entitlementsFor(user.id)), {
      ...cors,
      "Set-Cookie": sessionCookie(token, { domain: COOKIE_DOMAIN, secure: !ALLOW_LOCALHOST }),
    });
  },

  /*
   * Ask for a reset link.
   *
   * ALWAYS answers the same way, whether or not the address has an account.
   * "No account with that email" is an account-enumeration oracle, and the
   * caller must show identical words either way. An error that does surface
   * here is therefore never about the address — it is about us (rate limit,
   * SMTP down) — which is exactly why it is worth returning rather than
   * swallowing.
   */
  "POST /v1/auth/forgot-password": async (req, res, cors) => {
    const { email, return_to } = await readJson(req);
    const same = { sent: true };
    if (!validEmail(email)) return send(res, 200, same, cors);

    if (!rateLimit(`forgot:${String(email).toLowerCase()}`, 3, 60 * 60 * 1000) ||
        !rateLimit(`forgot-ip:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
      // Still the same answer. A 429 here would itself be an oracle.
      return send(res, 200, same, cors);
    }

    const user = await one(
      `select * from users where lower(email::text) = lower($1) and deleted_at is null`, [email]
    );

    if (user) {
      const returnTo = safeReturnTo(return_to, {
        suffix: ORIGIN_SUFFIX, siteUrl: SITE_URL, allowLocalhost: ALLOW_LOCALHOST,
      });
      if (user.password_hash) {
        const token = newToken();
        await q(
          `insert into password_resets (token_hash, user_id, expires_at)
           values ($1, $2, now() + interval '1 hour')`,
          [hashToken(token), user.id]
        );
        const link = `${returnTo}${returnTo.includes("?") ? "&" : "?"}reset_token=${token}`;
        await sendPasswordReset(user.email, link).catch((err) => {
          // Logged, not surfaced: the caller already got the identical answer.
          console.error("reset mail failed:", err.message);
        });
      } else {
        /*
         * A Google-only account has no password to reset. Saying so on the
         * FORM would be the enumeration leak again — so say it in the EMAIL,
         * which only the account holder can read. Without this, somebody who
         * signed up with Google and forgot that fact asks for a reset, gets
         * nothing, and concludes the app is broken.
         */
        await sendPasswordReset(user.email, null, { googleOnly: true }).catch((err) => {
          console.error("reset mail failed:", err.message);
        });
      }
    }

    send(res, 200, same, cors);
  },

  "POST /v1/auth/reset-password": async (req, res, cors) => {
    const { token, password } = await readJson(req);
    if (typeof token !== "string" || typeof password !== "string" || password.length < 8) {
      return send(res, 400, { error: "Use at least 8 characters." }, cors);
    }

    const hash = await hashPassword(password);
    const userId = await tx(async (client) => {
      // Single-use enforced in SQL: the UPDATE only matches an unused,
      // unexpired row, so two simultaneous uses cannot both win.
      const claimed = await client.query(
        `update password_resets set used_at = now()
          where token_hash = $1 and used_at is null and expires_at > now()
        returning user_id`,
        [hashToken(token)]
      );
      if (!claimed.rows[0]) return null;
      const uid = claimed.rows[0].user_id;
      await client.query(`update users set password_hash = $2 where id = $1`, [uid, hash]);
      /*
       * Every other session is invalidated. The usual reason somebody resets
       * is that they believe someone else is in their account — a reset that
       * leaves the intruder signed in has done nothing.
       */
      await client.query(`delete from sessions where user_id = $1`, [uid]);
      // And any other outstanding reset link.
      await client.query(
        `update password_resets set used_at = now() where user_id = $1 and used_at is null`, [uid]
      );
      return uid;
    });

    if (!userId) {
      return send(res, 400, {
        error: "That link has expired or was already used. Ask for a new one.",
      }, cors);
    }

    const user = await one(`select * from users where id = $1`, [userId]);
    const sessionToken = await createSession(userId, req.headers["user-agent"]);
    send(res, 200, publicUser(user, await entitlementsFor(userId)), {
      ...cors,
      "Set-Cookie": sessionCookie(sessionToken, { domain: COOKIE_DOMAIN, secure: !ALLOW_LOCALHOST }),
    });
  },

  "POST /v1/auth/signout": async (req, res, cors) => {
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (token) await q(`delete from sessions where token_hash = $1`, [hashToken(token)]);
    // Local app data is deliberately untouched: signing out of an account is
    // not a request to delete the trips on the phone.
    send(res, 200, { ok: true }, {
      ...cors,
      "Set-Cookie": clearSessionCookie({ domain: COOKIE_DOMAIN, secure: !ALLOW_LOCALHOST }),
    });
  },

  /* --- billing -------------------------------------------------------------- */

  "POST /v1/checkout": async (req, res, cors) => {
    if (!stripe) return send(res, 503, { error: "billing is not configured" }, cors);
    const user = await currentUser(req);
    if (!user) return send(res, 401, { error: "Sign in first." }, cors);

    const { app_slug, return_url } = await readJson(req);
    if (typeof app_slug !== "string" || !/^[a-z0-9-]{1,40}$/.test(app_slug)) {
      return send(res, 400, { error: "unknown app" }, cors);
    }
    /*
     * THE PRICE IS RESOLVED HERE, FROM A SERVER-SIDE MAP. The browser sends a
     * slug and nothing else — no amount, no currency, not even a price id. A
     * client that can name the amount is a client that can name fifty cents,
     * and this endpoint is reachable directly whatever the UI offers.
     */
    const price = APP_PRICES[app_slug];
    if (!price) return send(res, 503, { error: `no price configured for ${app_slug}` }, cors);

    const returnUrl = safeReturnTo(return_url, {
      suffix: ORIGIN_SUFFIX, siteUrl: SITE_URL, allowLocalhost: ALLOW_LOCALHOST,
    });

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",                        // one-time, not a subscription
        line_items: [{ price, quantity: 1 }],
        customer: user.stripe_customer_id ?? undefined,
        customer_email: user.stripe_customer_id ? undefined : (user.email ?? undefined),
        client_reference_id: user.id,
        success_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}purchase=done`,
        cancel_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}purchase=cancelled`,
        metadata: { user_id: user.id, app_slug },
        // Copied onto the PaymentIntent too, because a refund arrives as
        // charge.refunded with no session context at all — only a payment
        // intent. Without this the webhook cannot tell which app to revoke.
        payment_intent_data: { metadata: { user_id: user.id, app_slug } },
      });
      if (!session.url) throw new Error("no url in session");
      send(res, 200, { url: session.url }, cors);
    } catch (err) {
      send(res, 502, { error: `could not start checkout: ${err.message}` }, cors);
    }
  },
};

/* --- Stripe webhook --------------------------------------------------------
 * Handled outside the table above because it needs the RAW body, and because
 * it must never carry CORS headers: it is called by Stripe's servers, never by
 * a browser. Advertising it to one invites a forged POST from a page we do not
 * control.
 */
async function stripeWebhook(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return send(res, 503, { error: "billing is not configured" });
  }
  const signature = req.headers["stripe-signature"];
  if (!signature) return send(res, 400, { error: "missing signature" });

  // THE RAW BYTES. The signature is over them, so anything that parses and
  // re-serialises first fails verification on a perfectly valid request — an
  // hour lost to a 400 that looks like Stripe's fault.
  const raw = await readBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // Unverifiable is not our error — it is somebody posting to a public URL.
    return send(res, 400, { error: `signature verification failed: ${err.message}` });
  }

  /*
   * Idempotency: claim the event by inserting its id (a primary key). Insert
   * FIRST and treat the conflict as "already seen", rather than
   * checking-then-inserting, which has a race two concurrent deliveries will
   * eventually find.
   */
  try {
    await q(`insert into webhook_events (event_id, type) values ($1, $2)`, [event.id, event.type]);
  } catch {
    // 200, not an error: from Stripe's point of view this delivery succeeded,
    // and anything else asks them to retry it forever.
    return send(res, 200, { received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      // A session can complete without being paid (an async method still
      // clearing). Granting on that is granting on a maybe.
      if (s.payment_status !== "paid") return send(res, 200, { received: true, unpaid: true });

      const userId = s.metadata?.user_id ?? s.client_reference_id;
      const appSlug = s.metadata?.app_slug;
      if (!userId || !appSlug) throw new Error("session missing user_id or app_slug");

      const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;

      // Upsert, never insert: a re-purchase after a refund has to flip the row
      // back to paid.
      await q(
        `insert into entitlements (user_id, app_slug, status, source, granted_at, revoked_at, stripe_payment_intent)
         values ($1, $2, 'paid', 'stripe', now(), null, $3)
         on conflict (user_id, app_slug) do update
           set status = 'paid', granted_at = now(), revoked_at = null,
               stripe_payment_intent = excluded.stripe_payment_intent`,
        [userId, appSlug, pi ?? null]
      );

      if (s.customer) {
        const customerId = typeof s.customer === "string" ? s.customer : s.customer.id;
        await q(
          `update users set stripe_customer_id = $2 where id = $1 and stripe_customer_id is null`,
          [userId, customerId]
        );
      }
      return send(res, 200, { received: true, granted: appSlug });
    }

    if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const charge = event.data.object;
      // A PARTIAL refund is not a revocation. Somebody refunded a dollar of
      // five still bought the app.
      if (event.type === "charge.refunded" && charge.amount_refunded < charge.amount) {
        return send(res, 200, { received: true, partial: true });
      }
      const pi = typeof charge.payment_intent === "string"
        ? charge.payment_intent : charge.payment_intent?.id;

      let userId = charge.metadata?.user_id;
      let appSlug = charge.metadata?.app_slug;
      if ((!userId || !appSlug) && pi) {
        const intent = await stripe.paymentIntents.retrieve(pi);
        userId = intent.metadata?.user_id ?? userId;
        appSlug = intent.metadata?.app_slug ?? appSlug;
      }

      if (userId && appSlug) {
        await q(
          `update entitlements set status = 'refunded', revoked_at = now()
            where user_id = $1 and app_slug = $2`, [userId, appSlug]
        );
      } else if (pi) {
        await q(
          `update entitlements set status = 'refunded', revoked_at = now()
            where stripe_payment_intent = $1`, [pi]
        );
      } else {
        throw new Error("cannot identify what to revoke");
      }
      return send(res, 200, { received: true, revoked: true });
    }

    return send(res, 200, { received: true, ignored: true });
  } catch (err) {
    /*
     * Verified but failed to apply. Release the claim so Stripe's retry can
     * have another go — otherwise the idempotency row turns a transient
     * database error into a purchase that is permanently lost, which is the
     * worst outcome available here.
     */
    await q(`delete from webhook_events where event_id = $1`, [event.id]).catch(() => {});
    console.error("webhook failed:", err.message);
    return send(res, 500, { error: err.message });
  }
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 320 && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value);
}

/* -------------------------------------------------------------------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  const cors = corsHeaders(req);

  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }

    if (url.pathname === "/v1/stripe/webhook" && req.method === "POST") {
      return await stripeWebhook(req, res);
    }

    const handler = routes[`${req.method} ${url.pathname}`];
    if (!handler) return send(res, 404, { error: "not found" }, cors);
    await handler(req, res, cors, url);
  } catch (err) {
    console.error(`${req.method} ${url.pathname} failed:`, err);
    // Never echo an internal message to the browser; it can name tables.
    send(res, err.status ?? 500, { error: err.status ? err.message : "something went wrong" }, cors);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`accounts service listening on ${PORT}`);
  console.log(`  cookie domain    ${COOKIE_DOMAIN}`);
  console.log(`  allowed origins  *${ORIGIN_SUFFIX}${ALLOW_LOCALHOST ? " + localhost" : ""}`);
  console.log(`  google           ${process.env.GOOGLE_CLIENT_ID ? "configured" : "NOT configured"}`);
  console.log(`  stripe           ${stripe ? "configured" : "NOT configured"}`);
  console.log(`  priced apps      ${Object.keys(APP_PRICES).join(", ") || "none"}`);
});

// Expired rows are dead weight and, for sessions, a slowly growing table.
// Hourly, in process, because a cron for three DELETEs is more moving parts
// than the problem deserves.
setInterval(() => {
  q(`delete from sessions where expires_at < now()`).catch(() => {});
  q(`delete from password_resets where expires_at < now() and used_at is null`).catch(() => {});
  q(`delete from oauth_states where expires_at < now()`).catch(() => {});
  q(`delete from webhook_events where received_at < now() - interval '90 days'`).catch(() => {});
}, 60 * 60 * 1000).unref();

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
