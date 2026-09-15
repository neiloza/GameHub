/**
 * Where a text selection is allowed to reach.
 *
 * A drag that starts in one card and ends three cards later hands somebody the
 * whole page — every heading, every button label, every scrap of layout text
 * between the two points. That is never what the person meant to copy, and on a
 * phone it is easy to do by accident: it happened inside the first-run
 * tour and got the step heading, the body, the button row and the footer status
 * line in one sweep.
 *
 * So a selection is confined to the region it began in. The rule is deliberately
 * one-directional — the *anchor* decides, because that is where the person
 * pressed, and the focus is wherever their finger happened to drift.
 *
 * This module is the decision only; the DOM wiring lives in the web app's
 * SelectionBoundary component. Keeping the rule pure is what lets it be tested
 * without a browser.
 */

/**
 * What counts as a region, most specific first.
 *
 * `data-selection-region` is the explicit opt-in, for a container holding
 * several blocks that should not merge — a dialog whose body, footer and status
 * line are separate thoughts. The rest are the structural containers this app
 * already uses: a card is a `section`, a table cell is its own answer, and a
 * `header`/`footer` inside a card is a band of its own.
 *
 * `li` is deliberately absent. Bullets are usually read — and copied — as a
 * set, and making each one a region would break selecting a whole list for the
 * sake of a bleed nobody complained about.
 */
export const SELECTION_REGION_SELECTOR = [
  '[data-selection-region]',
  'article',
  'section',
  '[role="dialog"]',
  '[role="alert"]',
  '[role="status"]',
  'figure',
  'blockquote',
  'td',
  'th',
  'header',
  'footer',
  'form',
].join(',');

/** What the boundary should do with a selection. */
export type SelectionVerdict =
  /** Anchor and focus agree — leave it alone. */
  | 'allow'
  /** The focus wandered out of the anchor's region; pull it back to the edge. */
  | 'clamp'
  /**
   * The drag began outside every region — on page padding, the gap between
   * cards, the background behind a dialog. There is no region to clamp to and
   * nothing was meaningfully targeted, so the selection is dropped. This is the
   * case that used to select the entire document.
   */
  | 'collapse';

/**
 * Decide, given the region each end of the selection landed in.
 *
 * Both arguments are whatever the caller resolved as the nearest region — an
 * opaque handle in the DOM, any comparable value in a test. `null` means the
 * end is not inside a region at all.
 */
export function selectionVerdict(
  anchorRegion: unknown | null,
  focusRegion: unknown | null
): SelectionVerdict {
  if (anchorRegion == null) return 'collapse';
  if (focusRegion === anchorRegion) return 'allow';
  return 'clamp';
}

/**
 * Whether a selection is worth policing at all.
 *
 * A collapsed selection is a caret, not a highlight. Text inside a form field
 * is the browser's own business — select-all in a textarea must keep working,
 * and clamping there would fight the user for no gain.
 */
export function shouldPoliceSelection(input: {
  collapsed: boolean;
  rangeCount: number;
  /** True when either end sits inside an input, textarea or contenteditable. */
  inTextEntry: boolean;
}): boolean {
  if (input.collapsed || input.rangeCount === 0) return false;
  if (input.inTextEntry) return false;
  return true;
}
