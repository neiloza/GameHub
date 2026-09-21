/**
 * Website field handling .
 *
 * A seller typing `example.com` was told "Invalid url" — every
 * website field ran a bare `z.string().url()`, which requires a scheme. The
 * rule is that all four of these are accepted:
 *
 *     example.com
 *     www.example.com
 *     https://example.com
 *     http://example.com
 *
 * so this module trims, adds `https://` when only a domain was entered, and
 * stores one standardized form. It stays optional throughout: plenty of
 * businesses do not have a website yet, and §1.3 says so explicitly.
 *
 * "Apply this website-field behavior throughout the application" — so this is
 * the only place the rule lives, and `optionalWebsite` / `requiredWebsite` in
 * schemas.ts are the only way to validate one.
 */

/** Schemes we will not silently turn into a website. */
const REJECTED_SCHEMES = /^(?:javascript|data|file|mailto|tel|ftp):/i;

/** A scheme is present when the value starts with `something://`. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * A hostname with at least one dot and a plausible TLD, optionally followed by
 * a path, query or fragment. Deliberately permissive about the path and strict
 * about the host — the host is the part we are inferring a scheme for.
 */
const BARE_DOMAIN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#].*)?$/i;

/**
 * Normalize a website the way a person would expect.
 *
 * Returns `null` for anything empty, and the input unchanged (trimmed) when it
 * cannot be understood — so the schema's own URL check is what reports the
 * error, with one message rather than two.
 */
export function normalizeWebsite(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Never invent a scheme for something that already carries a dangerous one.
  if (REJECTED_SCHEMES.test(trimmed)) return trimmed;

  const candidate = HAS_SCHEME.test(trimmed)
    ? trimmed
    : BARE_DOMAIN.test(trimmed)
      ? `https://${trimmed}`
      : trimmed;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return trimmed;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return trimmed;
  if (!url.hostname.includes('.')) return trimmed;

  // Standardized form: lowercase host, no trailing slash on a bare root, and
  // the rest of the URL left exactly as it was typed — paths and query
  // strings can be case-sensitive.
  url.hostname = url.hostname.toLowerCase();
  const normalized = url.toString();
  return url.pathname === '/' && !url.search && !url.hash
    ? normalized.replace(/\/$/, '')
    : normalized;
}

/** True when `normalizeWebsite` produced something storable. */
export function isValidWebsite(input: string | null | undefined): boolean {
  const normalized = normalizeWebsite(input);
  if (normalized === null) return false;
  try {
    const url = new URL(normalized);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
    );
  } catch {
    return false;
  }
}
