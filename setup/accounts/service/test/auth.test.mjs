/*
 * Tests for the pure, security-critical parts of the accounts service.
 *
 * READ THIS BEFORE TRUSTING A GREEN RUN.
 *
 * These cover the origin allow-list, the redirect guard, password hashing and
 * the cookie shape — the places where a mistake is a vulnerability rather than
 * a bug. They do NOT tell you that the service works end to end: no database,
 * no Google, no Stripe. That is what `verify.mjs` is for, run against a real
 * deployment.
 *
 * A green run here means "the boundary logic is correct", not "sign-in works".
 *
 *   node --test test/*.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isAllowedOrigin, safeReturnTo,
  hashPassword, verifyPassword,
  newToken, hashToken,
  sessionCookie, clearSessionCookie, readCookie,
  SESSION_COOKIE,
} from "../src/auth.js";

const SUFFIX = ".thewizardofoza.com";
const opts = { suffix: SUFFIX };

/* --- the origin allow-list -------------------------------------------------
 * This function is the security boundary of the whole design: it decides who
 * may make a credentialed request carrying the session cookie. Every case
 * below is a way somebody would try to get past it.
 */

test("allows every app on the domain — this is the SSO feature", () => {
  assert.equal(isAllowedOrigin("https://wander.thewizardofoza.com", opts), true);
  assert.equal(isAllowedOrigin("https://popcorn.thewizardofoza.com", opts), true);
  assert.equal(isAllowedOrigin("https://forest.thewizardofoza.com", opts), true);
});

test("allows the apex itself", () => {
  assert.equal(isAllowedOrigin("https://thewizardofoza.com", opts), true);
});

test("rejects a suffix-lookalike domain", () => {
  // The classic bypass: endsWith() without the leading dot would pass these.
  assert.equal(isAllowedOrigin("https://thewizardofoza.com.evil.com", opts), false);
  assert.equal(isAllowedOrigin("https://eviltheowizardofoza.com", opts), false);
  assert.equal(isAllowedOrigin("https://notthewizardofoza.com", opts), false);
});

test("rejects an unrelated origin", () => {
  assert.equal(isAllowedOrigin("https://example.com", opts), false);
});

test("rejects plain http, even on our own domain", () => {
  // A session cookie is Secure; an http origin cannot hold one, and allowing
  // it would only ever enable a downgrade.
  assert.equal(isAllowedOrigin("http://wander.thewizardofoza.com", opts), false);
});

test("rejects junk and absent origins", () => {
  assert.equal(isAllowedOrigin("", opts), false);
  assert.equal(isAllowedOrigin(undefined, opts), false);
  assert.equal(isAllowedOrigin("not a url", opts), false);
  assert.equal(isAllowedOrigin("null", opts), false);
});

test("localhost is allowed only when explicitly enabled", () => {
  assert.equal(isAllowedOrigin("http://localhost:8000", opts), false);
  assert.equal(
    isAllowedOrigin("http://localhost:8000", { ...opts, allowLocalhost: true }),
    true
  );
});

test("an empty suffix allows nothing — a missing env var must not open the door", () => {
  assert.equal(isAllowedOrigin("https://wander.thewizardofoza.com", { suffix: "" }), false);
});

/* --- the redirect guard --------------------------------------------------- */

const redirectOpts = { suffix: SUFFIX, siteUrl: "https://thewizardofoza.com" };

test("a return_to on the domain is kept", () => {
  assert.equal(
    safeReturnTo("https://wander.thewizardofoza.com/plan", redirectOpts),
    "https://wander.thewizardofoza.com/plan"
  );
});

test("an off-domain return_to falls back rather than erroring", () => {
  // A failed sign-in is worse than a slightly wrong landing page.
  assert.equal(safeReturnTo("https://evil.com/steal", redirectOpts), redirectOpts.siteUrl);
  assert.equal(safeReturnTo("https://thewizardofoza.com.evil.com/", redirectOpts), redirectOpts.siteUrl);
});

test("garbage return_to falls back", () => {
  assert.equal(safeReturnTo(undefined, redirectOpts), redirectOpts.siteUrl);
  assert.equal(safeReturnTo("javascript:alert(1)", redirectOpts), redirectOpts.siteUrl);
  assert.equal(safeReturnTo("//evil.com", redirectOpts), redirectOpts.siteUrl);
});

/* --- passwords ------------------------------------------------------------ */

test("a password verifies against its own hash", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
});

test("a wrong password does not verify", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("Correct horse battery staple", hash), false);
  assert.equal(await verifyPassword("", hash), false);
});

test("the same password hashes differently every time", async () => {
  // i.e. the salt is real. Two identical hashes would mean identical passwords
  // are visible as such in a database dump.
  const a = await hashPassword("same");
  const b = await hashPassword("same");
  assert.notEqual(a, b);
});

test("the hash carries its own parameters, so they can be raised later", async () => {
  const hash = await hashPassword("x");
  const [scheme, N, r, p] = hash.split("$");
  assert.equal(scheme, "scrypt");
  assert.ok(Number(N) >= 16384, "N should be at least 16384");
  assert.ok(Number(r) > 0 && Number(p) > 0);
});

test("an account with no password never verifies", async () => {
  // Google-only accounts have password_hash NULL. This must be false, never
  // throw, and never accidentally be true for an empty candidate.
  assert.equal(await verifyPassword("anything", null), false);
  assert.equal(await verifyPassword("", null), false);
});

/* --- tokens --------------------------------------------------------------- */

test("tokens are unique and long enough to be unguessable", () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(newToken());
  assert.equal(seen.size, 200);
  assert.ok(newToken().length >= 40);
});

test("token hashing is deterministic and does not return the token", () => {
  const token = newToken();
  assert.equal(hashToken(token), hashToken(token));
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token).length, 64);   // sha256 hex
});

/* --- the cookie ----------------------------------------------------------- */

test("the session cookie is scoped to the parent domain — the SSO mechanism", () => {
  const cookie = sessionCookie("abc", { domain: SUFFIX });
  assert.match(cookie, /Domain=\.thewizardofoza\.com/);
});

test("the session cookie is HttpOnly — the security argument for our own API", () => {
  // If this ever stops being true, an XSS in any one app can steal the session
  // for every app on the domain.
  assert.match(sessionCookie("abc", { domain: SUFFIX }), /HttpOnly/);
});

test("the session cookie is Secure and SameSite=Lax", () => {
  const cookie = sessionCookie("abc", { domain: SUFFIX });
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
});

test("Secure can be dropped for local development, and only then", () => {
  assert.doesNotMatch(sessionCookie("abc", { domain: SUFFIX, secure: false }), /Secure/);
});

test("clearing the cookie expires it on the same domain", () => {
  const cookie = clearSessionCookie({ domain: SUFFIX });
  assert.match(cookie, /Max-Age=0/);
  assert.match(cookie, /Domain=\.thewizardofoza\.com/);
});

test("readCookie finds the session among others and tolerates junk", () => {
  assert.equal(readCookie(`a=1; ${SESSION_COOKIE}=tok; b=2`, SESSION_COOKIE), "tok");
  assert.equal(readCookie("a=1; b=2", SESSION_COOKIE), null);
  assert.equal(readCookie("", SESSION_COOKIE), null);
  assert.equal(readCookie(undefined, SESSION_COOKIE), null);
  // A cookie whose name merely ends with ours must not match.
  assert.equal(readCookie(`not_${SESSION_COOKIE}=nope`, SESSION_COOKIE), null);
});

/* --- the local-development case -------------------------------------------
 * Found by running the service for real: a browser refuses a cookie whose
 * Domain does not match the host it came from, so a COOKIE_DOMAIN left set to
 * the production domain during local development means sign-in appears to
 * succeed and the session instantly vanishes, with nothing in any console to
 * say the cookie was dropped.
 */

test("an absent domain yields a host-only cookie, which is what localhost needs", () => {
  const cookie = sessionCookie("abc", { domain: "", secure: false });
  assert.doesNotMatch(cookie, /Domain=/);
  // Everything else must survive: it is still a session cookie.
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /^woz_session=abc/);
});

test("clearing a host-only cookie also omits Domain", () => {
  // A mismatched Domain on the clear means the cookie is never removed, and
  // the user cannot sign out.
  assert.doesNotMatch(clearSessionCookie({ domain: "", secure: false }), /Domain=/);
});
