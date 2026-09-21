import { describe, expect, it } from 'vitest';
import {
  catalogueQuerySchema,
  enquirySchema,
  listingSchema,
  sellerApplicationSchema,
  applicationReviewSchema,
} from './schemas';

/**
 * These schemas are the client-side half of a rule the database also enforces.
 * What is worth testing is the places they deliberately differ from "whatever
 * the form sent" — a required price, a defaulted condition, a note that is only
 * required on some outcomes.
 */

const validListing = {
  name: 'Walnut desk lamp',
  category: 'home_garden',
  price_cents: 8900,
};

describe('listingSchema', () => {
  it('fills in the defaults a catalogue row needs', () => {
    const parsed = listingSchema.parse(validListing);
    expect(parsed.condition).toBe('new');
    expect(parsed.currency).toBe('USD');
    expect(parsed.status).toBe('draft');
  });

  it('requires a price, because a thing in a catalogue has one', () => {
    const result = listingSchema.safeParse({ ...validListing, price_cents: undefined });
    expect(result.success).toBe(false);
  });

  it('accepts a free item but not a negative one', () => {
    expect(listingSchema.safeParse({ ...validListing, price_cents: 0 }).success).toBe(true);
    expect(listingSchema.safeParse({ ...validListing, price_cents: -1 }).success).toBe(false);
  });

  it('keeps "not tracked" and "sold out" apart', () => {
    // Null is made-to-order or a service; zero is tracked and gone. Collapsing
    // them into one falsy value loses the difference the page renders.
    expect(listingSchema.parse({ ...validListing, stock_quantity: null }).stock_quantity).toBeNull();
    expect(listingSchema.parse({ ...validListing, stock_quantity: 0 }).stock_quantity).toBe(0);
  });

  it('will not let a form publish straight to suspended', () => {
    const result = listingSchema.safeParse({ ...validListing, status: 'suspended' });
    expect(result.success).toBe(false);
  });

  it('accepts a bare domain as a website', () => {
    const parsed = listingSchema.parse({ ...validListing, website: 'example.com' });
    expect(parsed.website).toBe('https://example.com');
  });
});

describe('catalogueQuerySchema', () => {
  it('defaults to the newest first page', () => {
    const parsed = catalogueQuerySchema.parse({});
    expect(parsed.sort).toBe('newest');
    expect(parsed.page).toBe(1);
  });

  it('refuses a page before the first', () => {
    expect(catalogueQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('refuses a sort it has no ordering for', () => {
    expect(catalogueQuerySchema.safeParse({ sort: 'random' }).success).toBe(false);
  });
});

describe('enquirySchema', () => {
  it('will not open a thread with nothing in it', () => {
    expect(enquirySchema.safeParse({ listing_id: crypto.randomUUID(), body: '   ' }).success).toBe(
      false
    );
  });

  it('trims what it stores', () => {
    const parsed = enquirySchema.parse({
      listing_id: '00000000-0000-4000-8000-000000000001',
      body: '  Is this still available?  ',
    });
    expect(parsed.body).toBe('Is this still available?');
  });
});

describe('sellerApplicationSchema', () => {
  const base = {
    contact_name: 'Sam',
    contact_email: 'sam@example.com',
    motivation: 'I make lamps.',
    shop_name: 'Walnut & Brass',
    seller_type: 'artist' as const,
  };

  it('needs at least one category, so the shop is findable', () => {
    expect(sellerApplicationSchema.safeParse({ ...base, categories: [] }).success).toBe(false);
    expect(
      sellerApplicationSchema.safeParse({ ...base, categories: ['home_garden'] }).success
    ).toBe(true);
  });
});

describe('applicationReviewSchema', () => {
  it('lets an approval stand on its own', () => {
    expect(applicationReviewSchema.safeParse({ status: 'approved' }).success).toBe(true);
  });

  it('demands a reason for anything else — the applicant reads it', () => {
    expect(applicationReviewSchema.safeParse({ status: 'rejected' }).success).toBe(false);
    expect(applicationReviewSchema.safeParse({ status: 'rejected', note: '  ' }).success).toBe(
      false
    );
    expect(
      applicationReviewSchema.safeParse({ status: 'rejected', note: 'Not enough detail.' }).success
    ).toBe(true);
  });
});
