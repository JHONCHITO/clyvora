
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

export type Draft = {
  id: string;
  content: string;
  format: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type DraftRow = {
  id: string;
  content: string;
  format: string;
  status: string;
  created_at: Date;
  updated_at: Date;
};

declare global {
  var clyvoraDraftPool: Pool | undefined;
}

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("La base de datos no está configurada.");
  }

  if (!global.clyvoraDraftPool) {
    global.clyvoraDraftPool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return global.clyvoraDraftPool;
}

async function ensureTable(): Promise<void> {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS content_drafts (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'Reel / video corto',
      status TEXT NOT NULL DEFAULT 'Pendiente de revisión',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function mapDraft(row: DraftRow): Draft {
  return {
    id: row.id,
    content: row.content,
    format: row.format,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listDrafts(): Promise<Draft[]> {
  await ensureTable();

  const result = await getPool().query<DraftRow>(`
    SELECT id, content, format, status, created_at, updated_at
    FROM content_drafts
    ORDER BY updated_at DESC
  `);

  return result.rows.map(mapDraft);
}

export async function createDraft(input: {
  content: string;
  format: string;
  status: string;
}): Promise<Draft> {
  await ensureTable();

  const result = await getPool().query<DraftRow>(
    `
      INSERT INTO content_drafts (id, content, format, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, format, status, created_at, updated_at
    `,
    [randomUUID(), input.content, input.format, input.status]
  );

  return mapDraft(result.rows[0]);
}
