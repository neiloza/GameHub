/*
 * Tests for the merge rule — the code that decides whether anybody loses data.
 *
 * These are pure and need no network. What they do NOT prove is that the sync
 * PROTOCOL works against a real database; that is exercised separately by
 * driving the service (see SYNC.md).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeDocument } from "../../../starter-kit/js/sync.js";

test("two offline devices both keep their saves — the whole point", () => {
  // Phone A saved two places, phone B saved a different one, both offline.
  // Last-write-wins would throw one set away silently.
  const a = { alpha: 1, beta: 2 };
  const b = { gamma: 3 };
  const merged = mergeDocument(a, b);
  assert.deepEqual(merged, { alpha: 1, beta: 2, gamma: 3 });
});

test("merge is symmetric in what it KEEPS, whichever side is local", () => {
  const a = { alpha: 1 };
  const b = { beta: 2 };
  assert.deepEqual(
    Object.keys(mergeDocument(a, b)).sort(),
    Object.keys(mergeDocument(b, a)).sort()
  );
});

test("nested id-keyed maps union rather than one branch replacing the other", () => {
  const local  = { saved: { p1: 100 }, skipped: { p9: 1 } };
  const remote = { saved: { p2: 200 } };
  assert.deepEqual(mergeDocument(local, remote), {
    saved: { p1: 100, p2: 200 },
    skipped: { p9: 1 },
  });
});

test("a scalar takes the remote value by default, or local when asked", () => {
  assert.equal(mergeDocument({ theme: "dark" }, { theme: "light" }).theme, "light");
  assert.equal(
    mergeDocument({ theme: "dark" }, { theme: "light" }, { preferLocal: true }).theme,
    "dark"
  );
});

test("arrays are replaced, never concatenated", () => {
  // Concatenating would duplicate every element on every sync — a list that
  // doubles in length each time is worse than one that loses an edit.
  assert.deepEqual(mergeDocument({ order: [1, 2] }, { order: [3] }).order, [3]);
});

test("a missing side is not treated as an instruction to delete", () => {
  // The single most destructive bug available here: reading "the server sent
  // nothing" as "the server says you have nothing".
  assert.deepEqual(mergeDocument({ a: 1 }, null), { a: 1 });
  assert.deepEqual(mergeDocument({ a: 1 }, undefined), { a: 1 });
  assert.deepEqual(mergeDocument(null, { b: 2 }), { b: 2 });
});

test("an empty remote object does not wipe local keys", () => {
  assert.deepEqual(mergeDocument({ a: 1 }, {}), { a: 1 });
});

test("merging is not destructive to its inputs", () => {
  const local = { saved: { p1: 1 } };
  const remote = { saved: { p2: 2 } };
  mergeDocument(local, remote);
  assert.deepEqual(local, { saved: { p1: 1 } }, "local was mutated");
  assert.deepEqual(remote, { saved: { p2: 2 } }, "remote was mutated");
});
