/**
 * EduManage – create the database tables
 *
 *   npm run db:setup -- --check   (read-only: lists the tables that already exist)
 *   npm run db:setup              (runs supabase/schema.sql)
 *
 * Needs the direct Postgres connection string in .env.local as SUPABASE_DB_URL
 * (Supabase Dashboard → Connect → "Session pooler" / "Direct connection" URI).
 * Alternative: paste supabase/schema.sql into the Supabase SQL Editor and click Run.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const connectionString = process.env.SUPABASE_DB_URL || process.env.NEXT_PUBLIC_SUPABASE_DIRECT;
if (!connectionString || !/^postgres(ql)?:\/\//.test(connectionString)) {
  console.error("✗ SUPABASE_DB_URL (a postgresql://… connection string) is missing in .env.local.");
  console.error("  Or run supabase/schema.sql in the Supabase SQL Editor instead.");
  process.exit(1);
}
if (process.env.NEXT_PUBLIC_SUPABASE_DIRECT) {
  console.warn("! Rename NEXT_PUBLIC_SUPABASE_DIRECT to SUPABASE_DB_URL – the NEXT_PUBLIC_ prefix is for browser-safe values only.");
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
);
console.log(`Tables currently in the public schema: ${rows.map((r) => r.table_name).join(", ") || "(none)"}`);

if (process.argv.includes("--check")) {
  await client.end();
  process.exit(0);
}

await client.query(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
console.log("✓ EduManage schema created (tables, security policies, grading rules).");
await client.end();
