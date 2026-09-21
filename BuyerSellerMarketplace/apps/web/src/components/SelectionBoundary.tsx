'use client';

import { useEffect } from 'react';
import {
  SELECTION_REGION_SELECTOR,
  selectionVerdict,
  shouldPoliceSelection,
} from '@marketplace/shared';

/**
 * Keeps a highlight inside the thing it started in.
 *
 * CSS can say what is selectable but not how far a selection may travel: a drag
 * from the top of a card to the bottom of the page selects everything in
 * between, and `user-select: none` on the parts you press only removes them
 * from the copied text — the sweep still runs the length of the document.
 *
 * So the boundary is enforced here, on `selectionchange`: whichever region the
 * person pressed in is the one they get, and a focus that wandered out is
 * pulled back to that region's edge. A drag that began on page background —
 * between cards, on the backdrop behind a dialog — is dropped, because that is
 * the gesture that used to hand somebody the entire page.
 *
 * The rule itself is in packages/shared/src/lib/selection.ts and unit-tested
 * there; this file is only the DOM.
 */
export function SelectionBoundary() {
  useEffect(() => {
    // Our own setBaseAndExtent fires selectionchange again. Without this the
    // handler answers itself forever.
    let adjusting = false;

    function regionOf(node: Node | null): Element | null {
      if (!node) return null;
      const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
      return el ? el.closest(SELECTION_REGION_SELECTOR) : null;
    }

    const TEXT_ENTRY = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

    /**
     * Whether the browser is doing its own thing in a form field.
     *
     * `activeElement` is the load-bearing half. Selecting inside an `<input>`
     * does fire selectionchange, but the document selection it reports anchors
     * on the field's *parent* — `closest()` walks upward and so never finds the
     * field. Checking only the anchor node let this wipe the selection out of
     * every input on the site: ctrl-A in a sign-up field selected nothing.
     */
    function inTextEntry(node: Node | null): boolean {
      if (document.activeElement?.closest(TEXT_ENTRY)) return true;
      if (!node) return false;
      const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
      return !!el?.closest(TEXT_ENTRY);
    }

    function onSelectionChange() {
      if (adjusting) return;
      const sel = document.getSelection();
      if (!sel) return;

      if (
        !shouldPoliceSelection({
          collapsed: sel.isCollapsed,
          rangeCount: sel.rangeCount,
          inTextEntry: inTextEntry(sel.anchorNode) || inTextEntry(sel.focusNode),
        })
      ) {
        return;
      }

      const anchorRegion = regionOf(sel.anchorNode);
      const verdict = selectionVerdict(anchorRegion, regionOf(sel.focusNode));
      if (verdict === 'allow') return;

      adjusting = true;
      try {
        if (verdict === 'collapse' || !anchorRegion || !sel.anchorNode) {
          sel.removeAllRanges();
          return;
        }

        // Which edge of the region to stop at is the direction of travel: the
        // focus is either ahead of the anchor in document order or behind it.
        const bounds = document.createRange();
        bounds.selectNodeContents(anchorRegion);
        const forward =
          !sel.focusNode ||
          !!(
            sel.anchorNode.compareDocumentPosition(sel.focusNode) &
            Node.DOCUMENT_POSITION_FOLLOWING
          );

        sel.setBaseAndExtent(
          sel.anchorNode,
          sel.anchorOffset,
          forward ? bounds.endContainer : bounds.startContainer,
          forward ? bounds.endOffset : bounds.startOffset
        );
      } catch {
        // A range can go stale mid-drag if React re-renders underneath it.
        // Losing the highlight is a great deal better than throwing.
        sel.removeAllRanges();
      } finally {
        // Let the event we just caused settle before listening again.
        setTimeout(() => {
          adjusting = false;
        }, 0);
      }
    }

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  return null;
}
