import { describe, expect, it } from 'vitest';
import { explainScore, rankListings, scoreListing, SCORE_WEIGHTS, type ScoringPrefs } from './matching';

const prefs: ScoringPrefs = {
  categories: ['software_technology'],
  stages: ['early'],
  budget_min_cents: 100_000,
  budget_max_cents: 500_000,
  locations: ['Austin'],
};

const listing = {
  category: 'software_technology',
  stage: 'early',
  price_cents: 250_000,
  location: 'Austin, TX',
};

describe('scoreListing', () => {
  it('scores a full match as the sum of every weight', () => {
    const result = scoreListing(prefs, listing);
    expect(result).toEqual({
      category: true,
      stage: true,
      budget: true,
      location: true,
      total:
        SCORE_WEIGHTS.category + SCORE_WEIGHTS.stage + SCORE_WEIGHTS.budget + SCORE_WEIGHTS.location,
    });
  });

  it('scores nothing when the buyer has stated no preferences', () => {
    // An absent preference row is "no opinion", not "everything" — otherwise
    // every listing scores full marks and the ranking collapses to date order.
    expect(scoreListing(null, listing).total).toBe(0);
  });

  it('treats an empty preference list as matching nothing', () => {
    const empty: ScoringPrefs = {
      categories: [],
      stages: [],
      budget_min_cents: null,
      budget_max_cents: null,
      locations: [],
    };
    const result = scoreListing(empty, listing);
    expect(result.category).toBe(false);
    expect(result.stage).toBe(false);
    expect(result.location).toBe(false);
    // An open-ended budget does match: null means "no limit", not "no opinion".
    expect(result.budget).toBe(true);
  });

  it('weights category above stage above the two tie-breakers', () => {
    const categoryOnly = scoreListing(prefs, { ...listing, stage: 'scaling', price_cents: null, location: null });
    const stageOnly = scoreListing(prefs, { ...listing, category: 'other', price_cents: null, location: null });
    expect(categoryOnly.total).toBeGreaterThan(stageOnly.total);
  });

  it('matches a location by substring, case-insensitively', () => {
    expect(scoreListing(prefs, { ...listing, location: 'austin, texas' }).location).toBe(true);
    expect(scoreListing(prefs, { ...listing, location: 'Boston, MA' }).location).toBe(false);
  });

  it('does not match a budget when the listing has no price', () => {
    expect(scoreListing(prefs, { ...listing, price_cents: null }).budget).toBe(false);
  });

  it('includes both ends of the budget range', () => {
    expect(scoreListing(prefs, { ...listing, price_cents: 100_000 }).budget).toBe(true);
    expect(scoreListing(prefs, { ...listing, price_cents: 500_000 }).budget).toBe(true);
    expect(scoreListing(prefs, { ...listing, price_cents: 500_001 }).budget).toBe(false);
  });
});

describe('rankListings', () => {
  it('orders by score, then newest first within a score', () => {
    const ranked = rankListings(prefs, [
      { ...listing, category: 'other', stage: 'scaling', created_at: '2026-01-01' },
      { ...listing, created_at: '2026-01-01' },
      { ...listing, category: 'other', stage: 'scaling', created_at: '2026-02-01' },
    ]);
    expect(ranked[0]!.score).toBe(7);
    expect(ranked[1]!.created_at).toBe('2026-02-01');
    expect(ranked[2]!.created_at).toBe('2026-01-01');
  });

  it('does not mutate the input', () => {
    const input = [{ ...listing, created_at: '2026-01-01' }];
    rankListings(prefs, input);
    expect(input[0]).not.toHaveProperty('score');
  });
});

describe('explainScore', () => {
  it('lists the reasons in weight order and says nothing about misses', () => {
    expect(explainScore(scoreListing(prefs, listing))).toEqual([
      'Category you follow',
      'Stage you asked for',
      'Within your budget',
      'Near you',
    ]);
    expect(explainScore(scoreListing(null, listing))).toEqual([]);
  });
});
