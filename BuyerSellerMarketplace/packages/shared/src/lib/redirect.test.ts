import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './redirect';

const FALLBACK = '/onboarding';

describe('safeRedirectPath', () => {
  it('keeps an ordinary same-origin path', () => {
    expect(safeRedirectPath('/businesses', FALLBACK)).toBe('/businesses');
    expect(safeRedirectPath('/auth/reset-password', FALLBACK)).toBe('/auth/reset-password');
  });

  it('keeps a query string and a fragment, which real destinations carry', () => {
    expect(safeRedirectPath('/membership?checkout=success', FALLBACK)).toBe(
      '/membership?checkout=success'
    );
    expect(safeRedirectPath('/resources#state', FALLBACK)).toBe('/resources#state');
  });

  it('refuses an absolute URL', () => {
    expect(safeRedirectPath('https://evil.test/x', FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath('http://evil.test', FALLBACK)).toBe(FALLBACK);
  });

  it('refuses a protocol-relative URL, which reads as a host rather than a path', () => {
    expect(safeRedirectPath('//evil.test/x', FALLBACK)).toBe(FALLBACK);
    // The reason it cannot be waved through by a bare startsWith('/') check.
    expect(new URL('//evil.test/x', 'https://site.test').host).toBe('evil.test');
  });

  it('refuses a backslash after the leading slash', () => {
    expect(safeRedirectPath('/\\evil.test', FALLBACK)).toBe(FALLBACK);
  });

  it('refuses an executing scheme', () => {
    expect(safeRedirectPath('javascript:alert(1)', FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath('data:text/html,<script>', FALLBACK)).toBe(FALLBACK);
  });

  it('refuses a relative path, which resolves against the current location', () => {
    expect(safeRedirectPath('auth/sign-in', FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath('../admin', FALLBACK)).toBe(FALLBACK);
  });

  it('refuses control characters, including the CR/LF used to split headers', () => {
    expect(safeRedirectPath('/ok\r\nLocation: https://evil.test', FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath('/ok\x00', FALLBACK)).toBe(FALLBACK);
  });

  it('falls back for absent or empty input', () => {
    expect(safeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath('', FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath('   ', FALLBACK)).toBe(FALLBACK);
  });
});
