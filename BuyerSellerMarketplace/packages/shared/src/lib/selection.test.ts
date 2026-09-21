import { describe, expect, it } from 'vitest';
import {
  SELECTION_REGION_SELECTOR,
  selectionVerdict,
  shouldPoliceSelection,
} from './selection';

describe('selectionVerdict', () => {
  const card = Symbol('card');
  const other = Symbol('other card');

  it('leaves a selection inside one region alone', () => {
    expect(selectionVerdict(card, card)).toBe('allow');
  });

  it('clamps a selection that wandered into another region', () => {
    expect(selectionVerdict(card, other)).toBe('clamp');
  });

  it('clamps when the focus left every region', () => {
    // Dragging off the bottom of a card onto the page background.
    expect(selectionVerdict(card, null)).toBe('clamp');
  });

  it('drops a drag that began outside every region', () => {
    // The whole-page rip: press on the body, drag to the end of the document.
    expect(selectionVerdict(null, other)).toBe('collapse');
    expect(selectionVerdict(null, null)).toBe('collapse');
  });

  it('reads the anchor, not the focus, as the authority', () => {
    // Same pair of regions, opposite directions, mirrored outcomes: which end
    // the person pressed on is what decides.
    expect(selectionVerdict(card, other)).toBe('clamp');
    expect(selectionVerdict(other, card)).toBe('clamp');
    expect(selectionVerdict(null, card)).toBe('collapse');
    expect(selectionVerdict(card, null)).toBe('clamp');
  });
});

describe('shouldPoliceSelection', () => {
  const base = { collapsed: false, rangeCount: 1, inTextEntry: false };

  it('polices an ordinary highlight', () => {
    expect(shouldPoliceSelection(base)).toBe(true);
  });

  it('ignores a caret', () => {
    expect(shouldPoliceSelection({ ...base, collapsed: true })).toBe(false);
  });

  it('ignores an empty selection', () => {
    expect(shouldPoliceSelection({ ...base, rangeCount: 0 })).toBe(false);
  });

  it('keeps out of form fields', () => {
    // Select-all in a textarea is the browser's job and must keep working.
    expect(shouldPoliceSelection({ ...base, inTextEntry: true })).toBe(false);
  });
});

describe('SELECTION_REGION_SELECTOR', () => {
  it('is a usable selector list', () => {
    expect(SELECTION_REGION_SELECTOR.split(',').length).toBeGreaterThan(5);
    expect(SELECTION_REGION_SELECTOR).toContain('[data-selection-region]');
  });

  it('leaves list items out, so a whole list stays selectable', () => {
    const parts = SELECTION_REGION_SELECTOR.split(',');
    expect(parts).not.toContain('li');
    expect(parts).not.toContain('ul');
    expect(parts).not.toContain('ol');
  });

  it('treats a table cell as its own region, so a table cannot be ripped whole', () => {
    const parts = SELECTION_REGION_SELECTOR.split(',');
    expect(parts).toContain('td');
    expect(parts).toContain('th');
  });
});
