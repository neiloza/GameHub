import pg from "pg";

/*
 * One pool for the process. Fly machines are small and Postgres connection
 * slots are finite, so a pool per request (or per module) is how a service
 * that works fine in testing exhausts the database under any real load.
 */
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 8),
  idleTimeoutMillis: 30_000,
  // A connection attempt that hangs is worse than one that fails: the request
  // never returns and nothing anywhere says why.
  connectionTimeoutMillis: 10_000,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

export function q(text, params) {
  return pool.query(text, params);
}

export async function one(text, params) {
  const { rows } = await pool.query(text, params);
  return rows[0] ?? null;
}

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Find or create the user behind a verified provider identity.
 *
 * NOTE THE THING THIS DELIBERATELY DOES NOT DO: it never links to an existing
 * account by matching email. "This email matches" is a claim from a third
 * party, and merging two accounts on it means somebody who can receive mail at
 * an address can inherit another user's purchases. Linking happens only from
 * inside an already-authenticated session, where the user is asking for it.
 *
 * The consequence is real and must be surfaced in the UI: somebody who bought
 * with Google and later signs up with a password sees the free version. The
 * answer is a visible "Restore purchases", showing which method is signed in,
 * and the Stripe receipt as the recovery path of last resort.
 */
export async function upsertIdentity({ provider, subject, email, displayName }) {
  return tx(async (client) => {
    const existing = await client.query(
      `select u.* from identities i
         join users u on u.id = i.user_id
        where i.provider = $1 and i.subject = $2 and u.deleted_at is null`,
      [provider, subject]
    );
    if (existing.rows[0]) {
      const user = existing.rows[0];
      // Keep the display name fresh if we had none and the provider has one.
      if (!user.display_name && displayName) {
        await client.query(`update users set display_name = $2 where id = $1`, [
          user.id, displayName,
        ]);
        user.display_name = displayName;
      }
      return user;
    }

    const created = await client.query(
      `insert into users (email, display_name, email_verified_at)
       values ($1, $2, $3)
       returning *`,
      [email ?? null, displayName ?? null, provider === "google" ? new Date() : null]
    );
    const user = created.rows[0];

    await client.query(
      `insert into identities (provider, subject, user_id, email)
       values ($1, $2, $3, $4)
       on conflict (provider, subject) do nothing`,
      [provider, subject, user.id, email ?? null]
    );

    return user;
  });
}

export async function entitlementsFor(userId) {
  const { rows } = await q(
    `select app_slug, status from entitlements
      where user_id = $1 and status in ('paid','comped')`,
    [userId]
  );
  const out = {};
  for (const row of rows) out[row.app_slug] = true;
  return out;
}
