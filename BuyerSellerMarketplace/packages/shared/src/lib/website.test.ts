import { describe, expect, it } from 'vitest';
import { isValidWebsite, normalizeWebsite } from './website';

describe('normalizeWebsite — the four forms §1.3 requires', () => {
  it('accepts a bare domain', () => {
    expect(normalizeWebsite('example.com')).toBe('https://example.com');
  });

  it('accepts a www domain', () => {
    expect(normalizeWebsite('www.example.com')).toBe(
      'https://www.example.com'
    );
  });

  it('accepts https', () => {
    expect(normalizeWebsite('https://example.com')).toBe(
      'https://example.com'
    );
  });

  // §1.3: "Do not show an error solely because the protocol is missing" — and
  // equally, do not rewrite a protocol the member chose on purpose.
  it('accepts http and leaves it as http', () => {
    expect(normalizeWebsite('http://example.com')).toBe(
      'http://example.com'
    );
  });
});

describe('normalizeWebsite — trimming and emptiness', () => {
  it('trims before validating', () => {
    expect(normalizeWebsite('  example.com  ')).toBe('https://example.com');
    expect(normalizeWebsite('\thttps://example.com\n')).toBe('https://example.com');
  });

  it('treats empty, whitespace, null and undefined as no website', () => {
    expect(normalizeWebsite('')).toBeNull();
    expect(normalizeWebsite('   ')).toBeNull();
    expect(normalizeWebsite(null)).toBeNull();
    expect(normalizeWebsite(undefined)).toBeNull();
  });
});

describe('normalizeWebsite — standardized storage', () => {
  it('lowercases the host', () => {
    expect(normalizeWebsite('ExAmPlE.COM')).toBe('https://example.com');
    expect(normalizeWebsite('HTTPS://Example.com')).toBe('https://example.com');
  });

  it('drops a trailing slash on a bare root', () => {
    expect(normalizeWebsite('https://example.com/')).toBe('https://example.com');
    expect(normalizeWebsite('example.com/')).toBe('https://example.com');
  });

  it('keeps a real path, and keeps its case', () => {
    expect(normalizeWebsite('example.com/About-Us')).toBe('https://example.com/About-Us');
    expect(normalizeWebsite('https://example.com/a/b/')).toBe('https://example.com/a/b/');
  });

  it('keeps query strings and fragments', () => {
    expect(normalizeWebsite('example.com/?ref=Partner')).toBe(
      'https://example.com/?ref=Partner'
    );
    expect(normalizeWebsite('example.com/#Team')).toBe('https://example.com/#Team');
  });

  it('keeps a port and a subdomain', () => {
    expect(normalizeWebsite('shop.example.co.uk')).toBe('https://shop.example.co.uk');
    expect(normalizeWebsite('example.com:8080')).toBe('https://example.com:8080');
  });

  it('is idempotent', () => {
    for (const input of ['example.com', 'example.com/About', 'http://a.io']) {
      const once = normalizeWebsite(input);
      expect(normalizeWebsite(once)).toBe(once);
    }
  });
});

describe('normalizeWebsite — what it refuses to rescue', () => {
  // A scheme that could execute or embed must never be turned into a link the
  // product renders. Returning the input unchanged means the schema rejects it.
  it('never invents a scheme for a dangerous one', () => {
    for (const bad of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'file:///etc/passwd',
      'mailto:hello@example.com',
    ]) {
      expect(isValidWebsite(bad), bad).toBe(false);
    }
  });

  it('rejects a hostname with no dot', () => {
    expect(isValidWebsite('localhost')).toBe(false);
    expect(isValidWebsite('https://localhost')).toBe(false);
    expect(isValidWebsite('notadomain')).toBe(false);
  });

  it('rejects free text', () => {
    for (const bad of ['my website', 'coming soon!', 'ask me', '...']) {
      expect(isValidWebsite(bad), bad).toBe(false);
    }
  });

  it('rejects a bare TLD or a trailing dot label', () => {
    expect(isValidWebsite('.com')).toBe(false);
    expect(isValidWebsite('example.')).toBe(false);
  });
});

describe('isValidWebsite', () => {
  it('agrees with normalizeWebsite on the accepted forms', () => {
    for (const good of [
      'example.com',
      'www.example.com',
      'https://example.com',
      'http://example.com',
      'shop.example.co.uk/catalog?page=2',
    ]) {
      expect(isValidWebsite(good), good).toBe(true);
      expect(normalizeWebsite(good), good).not.toBeNull();
    }
  });

  it('treats absence as not-valid, which is why the field stays optional', () => {
    expect(isValidWebsite(null)).toBe(false);
    expect(isValidWebsite('')).toBe(false);
  });
});
