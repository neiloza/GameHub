/*
 * Cloud save — the sync endpoints.
 *
 * The server is DELIBERATELY IGNORANT of what any app stores. It moves opaque
 * JSON documents, tracks revisions, and refuses stale writes. It never parses
 * an app's data, never migrates it, and never merges it.
 *
 * Merging is the CLIENT's job, in the app, where the shape is known. That is
 * not laziness — a merge needs to know whether two versions of "saved" should
 * be unioned (usually right for an id-keyed map) or whether the newer wins
 * (right for a preference). The server cannot know which, and a server that
 * guesses silently destroys data.
 *
 * The protocol, in full:
 *
 *   GET  /v1/data/:app?since=<cursor>
 *        → { cursor, documents: [{ key, value, rev, deleted, updated_at }] }
 *        Everything that changed after <cursor>. Omit `since` for everything.
 *
 *   POST /v1/data/:app   { documents: [{ key, value, base_rev, deleted? }] }
 *        → { cursor, results: [{ key, ok, rev } | { key, conflict, server }] }
 *        Each document is accepted only if base_rev matches what is stored.
 *        A mismatch is NOT an error: it returns the server's copy so the
 *        client can merge and try again.
 */

import { q, one, tx } from "./db.js";

/* ---------------------------------------------------------------------------
 * Limits. Generous on purpose: this exists to stop a runaway loop writing a
 * megabyte a second, not to ration honest use. Forest carrying months of
 * sessions is precisely the case that must NOT be refused.
 * ------------------------------------------------------------------------- */
export const LIMITS = {
  DOC_BYTES: 1024 * 1024,          // one document
  USER_BYTES: 50 * 1024 * 1024,    // one account, all apps
  DOCS_PER_PUSH: 50,
  KEY_LENGTH: 100,
};

const APP_SLUG_RE = /^[a-z0-9-]{1,40}$/;
const KEY_RE = /^[A-Za-z0-9_.:-]{1,100}$/;

export function validAppSlug(slug) {
  return typeof slug === "string" && APP_SLUG_RE.test(slug);
}

/**
 * Pull everything that changed after `since`.
 *
 * Returns the cursor BEFORE the rows rather than after, so a client that
 * crashes mid-apply re-fetches rather than skipping. Re-fetching a document
 * you already have is free; missing one is data that never arrives.
 */
export async function pull(userId, appSlug, since = 0) {
  const { rows } = await q(
    `select key, value, rev, deleted, updated_at, seq
       from app_data
      where user_id = $1 and app_slug = $2 and seq > $3
      order by seq asc
      limit 500`,
    [userId, appSlug, Number(since) || 0]
  );

  // The cursor is the highest seq actually returned. If the limit truncated
  // the page the client simply asks again from there — which is why this is
  // computed from the rows rather than from the sequence's current value.
  const cursor = rows.length ? Number(rows[rows.length - 1].seq) : Number(since) || 0;

  return {
    cursor,
    more: rows.length === 500,
    documents: rows.map((r) => ({
      key: r.key,
      // A tombstone carries no value — sending the old contents of a deleted
      // document would be a small, permanent privacy leak.
      value: r.deleted ? null : r.value,
      rev: Number(r.rev),
      deleted: r.deleted,
      updated_at: r.updated_at,
    })),
  };
}

/**
 * Push documents, each conditional on the revision it was based on.
 *
 * Returns a per-document result rather than failing the whole batch: one
 * conflicting document must not block nine clean ones, or a single busy
 * document can wedge an app's sync forever.
 */
export async function push(userId, appSlug, documents, writer) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return { results: [], cursor: 0 };
  }
  if (documents.length > LIMITS.DOCS_PER_PUSH) {
    const err = new Error(`at most ${LIMITS.DOCS_PER_PUSH} documents per push`);
    err.status = 400;
    throw err;
  }

  // Size is checked BEFORE the transaction opens, so an oversized payload
  // costs a validation pass rather than a write lock.
  let incoming = 0;
  for (const doc of documents) {
    if (!doc || typeof doc.key !== "string" || !KEY_RE.test(doc.key)) {
      const err = new Error(`invalid document key: ${String(doc?.key).slice(0, 40)}`);
      err.status = 400;
      throw err;
    }
    const size = doc.deleted ? 0 : Buffer.byteLength(JSON.stringify(doc.value ?? null));
    if (size > LIMITS.DOC_BYTES) {
      const err = new Error(
        `"${doc.key}" is ${Math.round(size / 1024)}KB; the limit is ` +
        `${Math.round(LIMITS.DOC_BYTES / 1024)}KB per document`
      );
      err.status = 413;
      throw err;
    }
    incoming += size;
  }

  const usage = await one(`select bytes from app_data_usage where user_id = $1`, [userId]);
  if ((Number(usage?.bytes) || 0) + incoming > LIMITS.USER_BYTES) {
    const err = new Error(
      "This account has reached its cloud-save limit. Your data is still safe " +
      "on this device — remove something, or download a backup."
    );
    err.status = 413;
    throw err;
  }

  return tx(async (client) => {
    const results = [];
    let cursor = 0;

    for (const doc of documents) {
      const existing = await client.query(
        `select rev, value, deleted, updated_at,
                octet_length(value::text) as bytes
           from app_data
          where user_id = $1 and app_slug = $2 and key = $3
          for update`,
        [userId, appSlug, doc.key]
      );
      const current = existing.rows[0];
      const baseRev = Number(doc.base_rev ?? 0);

      /*
       * THE CONFLICT CHECK, and the whole reason this endpoint is not a plain
       * upsert.
       *
       * base_rev 0 means "I believe this document does not exist yet". If it
       * does exist, that is a conflict too — it is the first-sign-in case,
       * where a device with local data meets an account that already has
       * some, and blindly letting the newcomer win is exactly how somebody
       * loses a forest they grew on another phone.
       */
      const storedRev = current ? Number(current.rev) : 0;
      if (storedRev !== baseRev) {
        results.push({
          key: doc.key,
          conflict: true,
          server: {
            value: current?.deleted ? null : current?.value ?? null,
            rev: storedRev,
            deleted: current?.deleted ?? false,
            updated_at: current?.updated_at ?? null,
          },
        });
        continue;
      }

      const nextRev = storedRev + 1;
      const value = doc.deleted ? {} : (doc.value ?? null);
      const seqRow = await client.query(`select nextval('app_data_seq') as seq`);
      const seq = Number(seqRow.rows[0].seq);

      await client.query(
        `insert into app_data (user_id, app_slug, key, value, rev, seq, deleted, updated_at, writer)
         values ($1, $2, $3, $4, $5, $6, $7, now(), $8)
         on conflict (user_id, app_slug, key) do update
           set value = excluded.value, rev = excluded.rev, seq = excluded.seq,
               deleted = excluded.deleted, updated_at = now(), writer = excluded.writer`,
        [userId, appSlug, doc.key, JSON.stringify(value), nextRev, seq,
         !!doc.deleted, (writer ?? "").slice(0, 60)]
      );

      const newBytes = doc.deleted ? 0 : Buffer.byteLength(JSON.stringify(value));
      const oldBytes = Number(current?.bytes) || 0;
      await client.query(
        `insert into app_data_usage (user_id, bytes, rows, updated_at)
         values ($1, $2, 1, now())
         on conflict (user_id) do update
           set bytes = greatest(0, app_data_usage.bytes + $2),
               rows = app_data_usage.rows + $3,
               updated_at = now()`,
        [userId, newBytes - oldBytes, current ? 0 : 1]
      );

      results.push({ key: doc.key, ok: true, rev: nextRev });
      cursor = Math.max(cursor, seq);
    }

    return { results, cursor };
  });
}

/** Everything this account is using, for a Settings screen. */
export async function usage(userId) {
  const row = await one(
    `select coalesce(bytes, 0) as bytes, coalesce(rows, 0) as rows
       from app_data_usage where user_id = $1`,
    [userId]
  );
  const { rows: byApp } = await q(
    `select app_slug, count(*)::int as documents,
            sum(octet_length(value::text))::bigint as bytes
       from app_data
      where user_id = $1 and deleted = false
      group by app_slug order by app_slug`,
    [userId]
  );
  return {
    bytes: Number(row?.bytes) || 0,
    limit: LIMITS.USER_BYTES,
    apps: byApp.map((a) => ({
      app_slug: a.app_slug,
      documents: a.documents,
      bytes: Number(a.bytes),
    })),
  };
}
