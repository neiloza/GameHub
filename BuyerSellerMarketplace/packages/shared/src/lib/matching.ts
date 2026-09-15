/**
 * Client-side mirror of the SQL scoring in `get_discovery_feed()`.
 *
 * Used to explain "why you're seeing this" on a card and to unit-test the
 * ranking rules. The database function remains the source of truth for the feed
 * itself — this is the same arithmetic in a place a test can reach.
 *
 * Keep the two in step. If you change a weight here, change it in the migration
 * that defines `get_discovery_feed()` in the same commit, or the explanation on
 * the card stops describing the order the cards arrived in.
 */

export type ScoringPrefs = {
  categories: string[];
  stages: string[];
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  locations: string[];
};

export type ScorableListing = {
  category: string;
  stage: string;
  price_cents: number | null;
  location: string | null;
};

export const SCORE_WEIGHTS = {
  category: 3,
  stage: 2,
  budget: 1,
  location: 1,
} as const;

export type ScoreBreakdown = {
  category: boolean;
  stage: boolean;
  budget: boolean;
  location: boolean;
  total: number;
};

/**
 * Score one listing against one buyer's stated preferences.
 *
 * An empty preference list matches nothing rather than everything: a buyer who
 * has named no categories has expressed no preference, and treating that as
 * "all categories" would give every listing a full category score and flatten
 * the ranking to creation order. The absent-preferences case is handled once,
 * at the top, by returning a zero breakdown.
 */
export function scoreListing(prefs: ScoringPrefs | null, listing: ScorableListing): ScoreBreakdown {
  if (!prefs) return { category: false, stage: false, budget: false, location: false, total: 0 };

  const category = prefs.categories.includes(listing.category);
  const stage = prefs.stages.includes(listing.stage);
  const budget =
    listing.price_cents != null &&
    listing.price_cents >= (prefs.budget_min_cents ?? 0) &&
    listing.price_cents <= (prefs.budget_max_cents ?? Number.MAX_SAFE_INTEGER);
  const location =
    listing.location != null &&
    prefs.locations.some((g) => listing.location!.toLowerCase().includes(g.toLowerCase()));

  const total =
    (category ? SCORE_WEIGHTS.category : 0) +
    (stage ? SCORE_WEIGHTS.stage : 0) +
    (budget ? SCORE_WEIGHTS.budget : 0) +
    (location ? SCORE_WEIGHTS.location : 0);

  return { category, stage, budget, location, total };
}

/** Highest score first, newest first within a score. */
export function rankListings<T extends ScorableListing & { created_at?: string }>(
  prefs: ScoringPrefs | null,
  listings: T[]
): (T & { score: number })[] {
  return listings
    .map((l) => ({ ...l, score: scoreListing(prefs, l).total }))
    .sort((a, b) => b.score - a.score || (b.created_at ?? '').localeCompare(a.created_at ?? ''));
}

/** The reasons a card matched, in weight order, for the "why am I seeing this" line. */
export function explainScore(breakdown: ScoreBreakdown): string[] {
  const reasons: string[] = [];
  if (breakdown.category) reasons.push('Category you follow');
  if (breakdown.stage) reasons.push('Stage you asked for');
  if (breakdown.budget) reasons.push('Within your budget');
  if (breakdown.location) reasons.push('Near you');
  return reasons;
}
