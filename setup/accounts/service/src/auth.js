import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

/* ---------------------------------------------------------------------------
 * Passwords
 *
 * node's built-in scrypt rather than bcrypt or argon2, deliberately: it is a
 * memory-hard KDF that ships with the runtime, so there is no native module to
 * rebuild on every Node upgrade and no dependency to audit. The parameters
 * below are the common baseline; N is the one to raise if hardware moves.
 *
 * The encoded form carries its own parameters, so raising them later does not
 * lock out anybody who hashed under the old ones — verify() reads whatever the
 * stored string says.
 * ------------------------------------------------------------------------- */

const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p });
  return [
    "scrypt", SCRYPT_N, SCRYPT_r, SCRYPT_p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password, stored) {
  if (!stored) {
    // An account with no password — i.e. Google-only. Still burn roughly the
    // same time as a real check would, so "this address has no password" is
    // not readable from how fast the answer came back.
    await scrypt(password, "timing", KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p });
    return false;
  }
  const [scheme, N, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(password, Buffer.from(salt, "base64url"), expected.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  // Constant-time: a byte-by-byte === leaks how much of the hash matched.
  return crypto.timingSafeEqual(expected, actual);
}

/* ---------------------------------------------------------------------------
 * Tokens
 *
 * Sessions and reset links are opaque random strings. What is stored is the
 * SHA-256 of the token, never the token — a leaked database dump must not be a
 * set of working logins, which is the same reasoning as not storing passwords
 * applied to the thing that stands in for one.
 *
 * SHA-256 with no salt is right here, unlike for passwords: the input is 32
 * bytes of CSPRNG output, so there is no dictionary to attack and no reason to
 * make verification slow.
 * ------------------------------------------------------------------------- */

export function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/* ---------------------------------------------------------------------------
 * The session cookie — the thing that makes one sign-in cover every app
 *
 * Scoped to the PARENT domain, so wander.thewizardofoza.com and
 * popcorn.thewizardofoza.com are sent the same cookie. That is the whole
 * feature.
 *
 * HttpOnly is the part worth dwelling on. Because the API sets this cookie and
 * the browser sends it automatically, no app's JavaScript ever needs to read
 * it — so an XSS in any one app cannot steal the session for all of them. A
 * token held in localStorage, or in a cookie readable by script, could not
 * make that promise. This is the main security advantage of running our own
 * API rather than talking to a hosted auth service from the browser.
 *
 * SameSite=Lax is sufficient DESPITE the request being cross-ORIGIN, because
 * SameSite is evaluated per SITE (registrable domain): api.thewizardofoza.com
 * and wander.thewizardofoza.com are the same site. It still needs CORS with
 * credentials, and getting one of those two halves without the other produces
 * a 401 that looks like an auth bug and is a header bug.
 * ------------------------------------------------------------------------- */

export const SESSION_COOKIE = "woz_session";
export const SESSION_DAYS = 60;

export function sessionCookie(token, { domain, secure = true }) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    `Domain=${domain}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie({ domain, secure = true }) {
  const parts = [
    `${SESSION_COOKIE}=`,
    `Domain=${domain}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/* ---------------------------------------------------------------------------
 * Origin allow-list
 *
 * Echoed from an allow-list, NEVER reflected blindly. Reflecting the Origin
 * header means any site anywhere can make credentialed requests as your
 * signed-in user — and since the session cookie is sent automatically, that is
 * the entire account. This function is the security boundary of the whole
 * design.
 *
 * `Access-Control-Allow-Origin: *` is not an option: the browser rejects it
 * outright when credentials are involved, and the error it prints talks about
 * the wildcard rather than about the cookie, so it reads as a CORS bug.
 * ------------------------------------------------------------------------- */

export function isAllowedOrigin(origin, { suffix, allowLocalhost = false }) {
  if (!origin) return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (allowLocalhost && url.protocol === "http:" && url.hostname === "localhost") return true;
  if (url.protocol !== "https:") return false;
  if (!suffix) return false;
  const dotted = suffix.startsWith(".") ? suffix : `.${suffix}`;
  const apex = dotted.slice(1);
  return url.hostname === apex || url.hostname.endsWith(dotted);
}

/**
 * A URL we are willing to send somebody back to after a redirect.
 *
 * Google sends the user to whatever we hand it, and `return_to` arrives in a
 * query string, so it is attacker-influenced in exactly the way an open
 * redirect needs. Anything not on the allow-list falls back to the site URL
 * rather than erroring — a failed sign-in is worse than a slightly wrong
 * landing page.
 */
export function safeReturnTo(candidate, { suffix, siteUrl, allowLocalhost = false }) {
  if (typeof candidate !== "string" || !candidate) return siteUrl;
  if (!isAllowedOrigin(originOf(candidate), { suffix, allowLocalhost })) return siteUrl;
  return candidate;
}

function originOf(href) {
  try {
    return new URL(href).origin;
  } catch {
    return "";
  }
}
