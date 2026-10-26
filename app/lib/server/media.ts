import { randomUUID } from "node:crypto";
import { getPool } from "./drafts";

export type VideoAsset = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  platform: "tiktok" | "instagram" | "facebook" | "none";
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  fingerprint: string;
  status: "ready" | "deleted";
  createdAt: string;
  updatedAt: string;
};

type VideoRow = {
  id: string;
  title: string;
  description: string;
  tags: string;
  platform: VideoAsset["platform"];
  url: string;
  pathname: string;
  content_type: string;
  size: number | string;
  fingerprint: string;
  status: VideoAsset["status"];
  created_at: Date;
  updated_at: Date;
};

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT 'none',
      url TEXT NOT NULL,
      pathname TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size BIGINT NOT NULL,
      fingerprint TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ready',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(kind, fingerprint)
    );
  `);
}

function map(row: VideoRow): VideoAsset {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    platform: row.platform,
    url: row.url,
    pathname: row.pathname,
    contentType: row.content_type,
    size: Number(row.size),
    fingerprint: row.fingerprint,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const columns = `
  id, title, description, tags, platform, url, pathname,
  content_type, size, fingerprint, status, created_at, updated_at
`;

export async function upsertVideo(
  input: Omit<VideoAsset, "id" | "status" | "createdAt" | "updatedAt">
) {
  await ensureTable();

  const result = await getPool().query<VideoRow>(
    `
      INSERT INTO media_assets (
        id, kind, title, description, tags, platform,
        url, pathname, content_type, size, fingerprint
      )
      VALUES ($1, 'video', $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (kind, fingerprint) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        platform = EXCLUDED.platform,
        url = EXCLUDED.url,
        pathname = EXCLUDED.pathname,
        content_type = EXCLUDED.content_type,
        size = EXCLUDED.size,
        status = 'ready',
        updated_at = NOW()
      RETURNING ${columns}
    `,
    [
      randomUUID(),
      input.title,
      input.description,
      input.tags.join(","),
      input.platform,
      input.url,
      input.pathname,
      input.contentType,
      input.size,
      input.fingerprint,
    ]
  );

  return map(result.rows[0]);
}

export async function listVideos() {
  await ensureTable();

  const result = await getPool().query<VideoRow>(
    `SELECT ${columns}
     FROM media_assets
     WHERE kind = 'video' AND status = 'ready'
     ORDER BY created_at DESC`
  );

  return result.rows.map(map);
}

export async function getVideo(id: string) {
  await ensureTable();

  const result = await getPool().query<VideoRow>(
    `SELECT ${columns}
     FROM media_assets
     WHERE id = $1 AND kind = 'video' AND status = 'ready'`,
    [id]
  );

  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function updateVideo(
  id: string,
  input: Pick<VideoAsset, "title" | "description" | "tags" | "platform">
) {
  await ensureTable();

  const result = await getPool().query<VideoRow>(
    `UPDATE media_assets
     SET title = $2, description = $3, tags = $4, platform = $5,
         updated_at = NOW()
     WHERE id = $1 AND kind = 'video' AND status = 'ready'
     RETURNING ${columns}`,
    [id, input.title, input.description, input.tags.join(","), input.platform]
  );

  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function markVideoDeleted(id: string) {
  await ensureTable();

  const result = await getPool().query<VideoRow>(
    `UPDATE media_assets
     SET status = 'deleted', updated_at = NOW()
     WHERE id = $1 AND kind = 'video' AND status = 'ready'
     RETURNING ${columns}`,
    [id]
  );

  return result.rows[0] ? map(result.rows[0]) : null;
}
