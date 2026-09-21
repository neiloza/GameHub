#!/usr/bin/env node
/*
 * Apply every migration in ./migrations, in filename order, once each.
 *
 * Deliberately tiny — no migration framework. The whole schema is one file
 * today and will be three by the time anyone reads this; a tool with a config
 * format would be more moving parts than the problem has.
 *
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(2);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

await client.connect();
await client.query(`
  create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const { rows } = await client.query("select name from schema_migrations");
const done = new Set(rows.map((r) => r.name));
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

let applied = 0;
for (const file of files) {
  if (done.has(file)) {
    console.log(`  skip  ${file}`);
    continue;
  }
  const sql = fs.readFileSync(path.join(dir, file), "utf8");
  // Each migration runs in its own transaction, so a failure half way leaves
  // the database on the last good state rather than on something in between.
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("insert into schema_migrations (name) values ($1)", [file]);
    await client.query("COMMIT");
    console.log(`  ok    ${file}`);
    applied++;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`  FAIL  ${file}\n        ${err.message}`);
    await client.end();
    process.exit(1);
  }
}

console.log(`\n${applied} migration(s) applied, ${files.length - applied} already present.`);
await client.end();
