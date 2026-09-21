#!/usr/bin/env node
/*
 * verify.mjs — check a DEPLOYED accounts service, hop by hop.
 *
 * WHY THIS EXISTS
 *
 * The service and its client were written in a sandbox with no network route
 * out. Unit tests cover the pure security boundary; they cannot tell you that
 * the deployment is wired up, because a stub would be written from the same
 * reasoning as the code and so could not falsify it. That is LESSONS.md P5,
 * and in this estate it once hid a real cause through twelve fix attempts.
 *
 * So this talks to the real thing and says WHICH HOP failed.
 *
 * Every line it prints feeds the verdict. A hop that failed is never reasoned
 * past because a different hop passed — a previous self-test here shipped
 * exactly that bug and sent somebody off to fix data that was fine.
 *
 *   node setup/accounts/verify.mjs --api https://api.thewizardofoza.com
 *
 * Optional:
 *   --origin https://wander.thewizardofoza.com   check CORS as that app
 *   --email you@example.com --password '...'     exercise sign-in end to end
 *   --forgot you@example.com                     send a real reset email
 *
 * It creates nothing and writes nothing, except the reset email you ask for.
 */

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};

const api = (arg("api") || "").replace(/\/$/, "");
if (!api) {
  console.error(`
usage: node setup/accounts/verify.mjs --api https://api.thewizardofoza.com
                                      [--origin https://wander.thewizardofoza.com]
                                      [--email … --password …] [--forgot …]
`);
  process.exit(2);
}

const origin = arg("origin") || "https://thewizardofoza.com";
const results = [];
let cookie = null;

async function hop(label, fn, { optional = false } = {}) {
  const t0 = Date.now();
  try {
    const note = await fn();
    results.push({ label, ok: true, optional });
    console.log(`  ok    ${label}${note ? ` — ${note}` : ""}  (${Date.now() - t0}ms)`);
  } catch (err) {
    results.push({ label, ok: false, note: err.message, optional });
    console.log(`  ${optional ? "warn " : "FAIL "} ${label} — ${err.message}  (${Date.now() - t0}ms)`);
  }
}

async function call(path, { method = "GET", body, withCookie = true } = {}) {
  const res = await fetch(`${api}${path}`, {
    method,
    redirect: "manual",
    headers: {
      Origin: origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(withCookie && cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { res, data, setCookie, text };
}

console.log(`\nVerifying ${api}\n  as origin ${origin}\n`);

// 1. Is it up, and is its database up? /healthz queries Postgres on purpose.
await hop("service and database healthy", async () => {
  const { res, data } = await call("/healthz", { withCookie: false });
  if (!res.ok) throw new Error(`HTTP ${res.status}${data?.error ? ` — ${data.error}` : ""}`);
  return "";
});

// 2. CORS. This is the single most likely thing to be wrong, and its symptom
//    in a browser is a 401 that looks like an auth bug.
await hop("CORS allows this origin with credentials", async () => {
  const res = await fetch(`${api}/v1/me`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  const allow = res.headers.get("access-control-allow-origin");
  const creds = res.headers.get("access-control-allow-credentials");
  if (!allow) throw new Error(`no Access-Control-Allow-Origin — ${origin} is not on the allow-list`);
  if (allow === "*") throw new Error("Allow-Origin is '*', which browsers reject with credentials");
  if (allow !== origin) throw new Error(`Allow-Origin is ${allow}, not ${origin}`);
  if (creds !== "true") throw new Error("Allow-Credentials is not true — the cookie will never be sent");
  return "";
});

// 3. A hostile origin must NOT be allowed. A verifier that only checks the
//    happy path would pass against a service that reflects any origin.
await hop("CORS refuses an unrelated origin", async () => {
  const res = await fetch(`${api}/v1/me`, {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "GET" },
  });
  const allow = res.headers.get("access-control-allow-origin");
  if (allow) throw new Error(`origin allow-list is too wide — it returned ${allow} for evil.example`);
  return "";
});

// 4. Anonymous /v1/me must answer cleanly rather than erroring, because every
//    app calls it on boot including for signed-out users.
await hop("anonymous /v1/me answers", async () => {
  const { res, data } = await call("/v1/me", { withCookie: false });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (data?.user !== null) throw new Error("expected user: null for an anonymous call");
  return "user: null, as expected";
});

// 5. Google. We do not follow the redirect to Google; we check the service
//    answers with one rather than an error.
await hop("google sign-in redirects to Google", async () => {
  const { res } = await call(
    `/v1/auth/google/start?return_to=${encodeURIComponent(origin)}`,
    { withCookie: false }
  );
  if (res.status === 503) throw new Error("google is not configured on the service");
  const location = res.headers.get("location") || "";
  if (res.status !== 302) throw new Error(`expected a 302, got ${res.status}`);
  if (!/accounts\.google\.com/.test(location)) {
    throw new Error(`did not redirect to Google (got ${location.slice(0, 100)})`);
  }
  if (!/redirect_uri=/.test(location)) throw new Error("no redirect_uri in the Google URL");
  return "";
});

// 6. An off-domain return_to must not survive. Open-redirect guard.
await hop("an off-domain return_to is refused", async () => {
  const { res } = await call(
    "/v1/auth/google/start?return_to=https%3A%2F%2Fevil.example%2F",
    { withCookie: false }
  );
  const location = res.headers.get("location") || "";
  const state = /state=([^&]+)/.exec(location)?.[1];
  if (!state) throw new Error("could not read state back to check it");
  // The return_to is stored server-side, so all we can check from out here is
  // that the service did not simply bounce us straight at evil.example.
  if (/evil\.example/.test(location)) throw new Error("the service redirected to an off-domain URL");
  return "";
});

// 7. Sign-in, only with credentials.
const email = arg("email");
const password = arg("password");

if (email && password) {
  await hop("password sign-in sets a session cookie", async () => {
    const { res, data, setCookie } = await call("/v1/auth/signin", {
      method: "POST", body: { email, password }, withCookie: false,
    });
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    const session = setCookie.find((c) => c.startsWith("woz_session="));
    if (!session) throw new Error("no woz_session cookie in the response");
    if (!/HttpOnly/i.test(session)) throw new Error("the session cookie is NOT HttpOnly");
    if (!/Domain=\./i.test(session)) {
      throw new Error("the cookie has no parent Domain — SSO across apps will NOT work");
    }
    cookie = session.split(";")[0];
    return session.match(/Domain=([^;]+)/i)?.[0] ?? "";
  });

  if (cookie) {
    await hop("the session is accepted on a later request", async () => {
      const { res, data } = await call("/v1/me");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!data?.user) throw new Error("signed in, but /v1/me says nobody is");
      return `${data.user.email} · entitlements: ${JSON.stringify(data.entitlements)}`;
    });

    await hop("sign-out clears the session", async () => {
      const { res } = await call("/v1/auth/signout", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const after = await call("/v1/me");
      if (after.data?.user) throw new Error("still signed in after sign-out");
      cookie = null;
      return "";
    });
  }
} else {
  console.log("  skip  password sign-in (pass --email and --password to include it)");
}

// 8. The reset request. Optional, because it sends real mail.
const forgot = arg("forgot");
if (forgot) {
  await hop("password reset accepted (identically for any address)", async () => {
    const a = await call("/v1/auth/forgot-password", {
      method: "POST", body: { email: forgot }, withCookie: false,
    });
    const b = await call("/v1/auth/forgot-password", {
      method: "POST",
      body: { email: `definitely-not-a-user-${Date.now()}@example.com` },
      withCookie: false,
    });
    if (a.res.status !== b.res.status || a.text !== b.text) {
      throw new Error(
        "a real address and an unknown one got DIFFERENT answers — that is an " +
        "account-enumeration oracle"
      );
    }
    return "identical answers, as required — now check the inbox AND the spam folder";
  }, { optional: true });
}

/* --- verdict -------------------------------------------------------------- */

const failed = results.filter((r) => !r.ok && !r.optional);
const warned = results.filter((r) => !r.ok && r.optional);

console.log("");
if (failed.length === 0) {
  console.log(`VERDICT: ${results.length - warned.length} hop(s) passed, nothing failed.`);
  if (warned.length) console.log(`         ${warned.length} optional hop(s) warned — see above.`);
  console.log("");
  console.log("This proves the service. It does NOT prove the browser half.");
  console.log("Sign in on one app, then open a DIFFERENT app on the domain and");
  console.log("confirm you are already signed in — that is the actual feature,");
  console.log("and only a browser can tell you. See SETUP.md step 9.");
} else {
  console.log(`VERDICT: ${failed.length} hop(s) FAILED:`);
  for (const f of failed) console.log(`  - ${f.label}: ${f.note}`);
  process.exitCode = 1;
}
console.log("");
