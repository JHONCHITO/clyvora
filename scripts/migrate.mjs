import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const directory = new URL('../migrations/', import.meta.url);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(731204811)');
  await client.query('CREATE TABLE IF NOT EXISTS clyvora_schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const names = (await readdir(directory)).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  for (const name of names) {
    const sql = await readFile(new URL(name, directory), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const prior = await client.query('SELECT checksum FROM clyvora_schema_migrations WHERE name = $1', [name]);
    if (prior.rowCount) {
      if (prior.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    await client.query(sql);
    await client.query('INSERT INTO clyvora_schema_migrations (name, checksum) VALUES ($1,$2)', [name, checksum]);
    console.log(`Applied ${name}`);
  }
  await client.query('COMMIT');
} catch {
  await client.query('ROLLBACK');
  console.error('Migration failed and was rolled back. Inspect the database privately; no credentials are logged.');
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
