import { Pool } from 'pg';

declare global { var clyvoraSocialPool: Pool | undefined; }

export function database() {
  if (!process.env.DATABASE_URL) throw new Error('Database not configured');
  if (!global.clyvoraSocialPool) {
    global.clyvoraSocialPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }
  return global.clyvoraSocialPool;
}
