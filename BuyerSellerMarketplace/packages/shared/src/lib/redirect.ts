/**
 * Where an auth callback is allowed to send somebody next.
 *
 * `/auth/callback` takes a `next` from the query string and redirects to it
 * after exchanging the code. That value arrives from an email link, so it is
 * attacker-influenced: a recovery or confirmation URL can be built by anyone
 * who can trigger one, and the link is clicked from an inbox — exactly the
 * context where a redirect to a convincing fake sign-in page pays off.
 *
 * The rule is a single allowlist shape rather than a blocklist: a `next` must
 * be one absolute, same-origin path. Everything else falls back.
 *
 * Rejected, and why each one matters:
 *
 *   https://evil.test/x   absolute URL — a plain open redirect
 *   //evil.test/x         protocol-relative; `new URL()` reads the host as
 *                         evil.test, so concatenating onto an origin string is
 *                         not enough to make a leading slash safe
 *   /\evil.test           backslash — several browsers normalise it to `/`
 *                         before parsing, so this is `//evil.test` in disguise
 *   javascript:alert(1)   a scheme that executes rather than navigates
 *   auth/sign-in          relative; resolves against whatever the current path
 *                         happens to be
 *
 * Kept deliberately narrow: a query string and a fragment are allowed because
 * real destinations carry them (`/membership?checkout=success`), but a
 * destination is always a path on this site.
 */

/** Anything that is not a plain same-origin absolute path. */
const UNSAFE = [
  /^[a-z][a-z0-9+.-]*:/i, // any scheme, javascript: and data: included
  /^\/\//, // protocol-relative
  /^\/\\/, // backslash after the leading slash, normalised to `//` by some browsers
  // eslint-disable-next-line no-control-regex -- the point is to reject these
  /[\x00-\x1f\x7f]/, // control characters, including the CR/LF used to split headers
];

/**
 * Narrow an untrusted `next` to a safe same-origin path.
 *
 * Returns `fallback` for anything it will not vouch for, so callers can use the
 * result directly rather than remembering to handle `null`. The fallback is a
 * literal the caller controls and is never validated — passing a hostile one is
 * the caller's own bug, not an input problem.
 */
export function safeRedirectPath(next: string | null | undefined, fallback: string): string {
  if (typeof next !== 'string') return fallback;

  const trimmed = next.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (UNSAFE.some((pattern) => pattern.test(trimmed))) return fallback;

  return trimmed;
}
