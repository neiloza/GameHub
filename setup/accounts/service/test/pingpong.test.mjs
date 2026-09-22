/*
 * Two devices, both open, nothing changing. Does sync settle, or ping-pong?
 *
 * THIS GUARDS A BUG THAT WAS REAL. Before the fingerprint check in sync.js:
 *
 *   device A pulls -> merges -> writes -> persist() -> touch() -> pushes
 *   device B pulls that -> merges -> writes -> pushes
 *   device A pulls that -> ...
 *
 * Two phones left open synced each other forever — continuous network traffic,
 * battery drain and an inflating sequence, with nothing whatsoever having
 * changed. Measured at 20 pushes across 20 idle syncs; it is 0 now.
 *
 * The server here is an in-process stub, and it is honest about what that
 * means: it proves the CLIENT settles, not that the real service agrees with
 * it. The real protocol is exercised by driving the deployed service — see
 * SYNC.md. A stub cannot falsify the reasoning that produced it
 * (setup/LESSONS.md P5), but it can catch a client that talks to itself.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createSync } from "../../../starter-kit/js/sync.js";

/* --- a minimal browser, and a minimal server ----------------------------- */

function browserShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.document = { addEventListener() {}, visibilityState: "visible" };
  globalThis.window = { addEventListener() {} };
  return store;
}

function fakeServer() {
  const rows = new Map();          // key -> { value, rev, seq }
  let seq = 0;
  const counts = { pulls: 0, pushes: 0 };

  globalThis.fetch = async (url, opts = {}) => {
    const u = new URL(url);
    const json = (body) => ({
      ok: true, status: 200, text: async () => JSON.stringify(body),
    });

    if (!opts.method || opts.method === "GET") {
      counts.pulls++;
      const since = Number(u.searchParams.get("since")) || 0;
      const documents = [...rows.entries()]
        .filter(([, r]) => r.seq > since)
        .sort((a, b) => a[1].seq - b[1].seq)
        .map(([key, r]) => ({ key, value: r.value, rev: r.rev, deleted: false }));
      const cursor = documents.length ? rows.get(documents.at(-1).key).seq : since;
      return json({ cursor, more: false, documents });
    }

    counts.pushes++;
    const body = JSON.parse(opts.body);
    const results = [];
    for (const doc of body.documents) {
      const current = rows.get(doc.key);
      const storedRev = current ? current.rev : 0;
      if (storedRev !== (doc.base_rev ?? 0)) {
        results.push({ key: doc.key, conflict: true,
          server: { value: current.value, rev: storedRev, deleted: false } });
        continue;
      }
      rows.set(doc.key, { value: doc.value, rev: storedRev + 1, seq: ++seq });
      results.push({ key: doc.key, ok: true, rev: storedRev + 1 });
    }
    return json({ results, cursor: seq });
  };

  return counts;
}

function device(initial) {
  const state = { saved: { ...initial } };
  const account = { signedIn: () => true, isPaid: () => true, onChange() {} };
  const sync = createSync(account, {
    apiUrl: "http://stub",
    appSlug: "pingpong",
    documents: { saved: { read: () => state.saved, write: (v) => { state.saved = v; } } },
  });
  return { state, sync };
}

/* ------------------------------------------------------------------------- */

test("two offline devices converge to the union of both", async () => {
  browserShim();
  fakeServer();
  const a = device({ p1: 1 });
  const b = device({ p2: 2 });

  await a.sync.sync();
  await b.sync.sync();
  await a.sync.sync();

  assert.deepEqual(a.state.saved, { p1: 1, p2: 2 });
  assert.deepEqual(b.state.saved, { p1: 1, p2: 2 });
});

test("once converged, idle syncs write NOTHING — no ping-pong", async () => {
  browserShim();
  const counts = fakeServer();
  const a = device({ p1: 1 });
  const b = device({ p2: 2 });

  await a.sync.sync();
  await b.sync.sync();
  await a.sync.sync();
  const settled = counts.pushes;

  for (let i = 0; i < 10; i++) {
    await a.sync.sync();
    await b.sync.sync();
  }

  assert.equal(
    counts.pushes - settled, 0,
    "idle syncs are still writing — the devices are syncing each other in a loop"
  );
});

test("a real change still pushes", async () => {
  // The dedupe must not be so eager that it swallows actual edits. Without
  // this, the test above could be satisfied by a client that never pushes.
  browserShim();
  const counts = fakeServer();
  const a = device({ p1: 1 });
  await a.sync.sync();
  const before = counts.pushes;

  a.state.saved = { ...a.state.saved, p9: 9 };
  await a.sync.sync();

  assert.equal(counts.pushes - before, 1, "a genuine edit was not pushed");
});
