/**
 * Applies supabase/schema.sql using direct Postgres (DATABASE_URL).
 * The Vite anon key cannot create tables; use the URI from
 * Supabase → Project Settings → Database → Connection string (URI).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DATABASE_URL = process.env.DATABASE_URL?.trim();
if (!DATABASE_URL) {
  console.error(
    'Missing DATABASE_URL in .env.\n' +
      'Add the Postgres URI from Supabase → Settings → Database → Connection string (not the anon key).\n' +
      'Or open supabase/schema.sql in the Supabase SQL Editor and run it there.',
  );
  process.exit(1);
}

const sql = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
} catch (e) {
  const err = /** @type {NodeJS.ErrnoException} */ (e);
  if (err.code === 'ENOTFOUND') {
    console.error(
      'DNS could not resolve the database host (ENOTFOUND).\n' +
        'Fix: In Supabase → Settings → Database, copy a fresh Connection string (URI).\n' +
        'Confirm the project is not paused (Dashboard restores it). Try another network or DNS (e.g. 8.8.8.8).\n' +
        'Or skip CLI: paste supabase/schema.sql into Supabase → SQL Editor and run there.',
    );
  } else {
    console.error(err.message || err);
  }
  process.exit(1);
}

try {
  await client.query(sql);
  console.log('OK — applied supabase/schema.sql (nexto_tasks, nexto_state, RLS).');
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
} finally {
  await client.end();
}
