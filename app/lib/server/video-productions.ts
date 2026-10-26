import { createHash, randomUUID } from "node:crypto";
import { getPool } from "./drafts";
import type { VideoProductionPlan } from "./jhon";

export type ProductionStatus = "queued" | "processing" | "completed" | "failed";

export type VideoProduction = {
  id: string;
  fingerprint: string;
  sourceContent: string;
  platform: "tiktok";
  plan: VideoProductionPlan;
  status: ProductionStatus;
  providerJobId: string | null;
  outputUrl: string | null;
  videoAssetId: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  contentType: string | null;
  size: number | null;
  error: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
};

type ProductionRow = Omit<VideoProduction, "plan" | "createdAt" | "updatedAt"> & {
  plan: string;
  created_at: Date;
  updated_at: Date;
};

export type ProductionInput = {
  sourceContent: string;
  platform: "tiktok";
};

function fingerprint(input: ProductionInput) {
  return createHash("sha256")
    .update(`${input.platform}\n${input.sourceContent.trim().replace(/\s+/g, " ")}`)
    .digest("hex");
}

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS video_productions (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL UNIQUE,
      source_content TEXT NOT NULL,
      platform TEXT NOT NULL,
      plan JSONB NOT NULL,
      status TEXT NOT NULL,
      provider_job_id TEXT,
      output_url TEXT,
      video_asset_id TEXT,
      duration_seconds INTEGER,
      width INTEGER,
      height INTEGER,
      content_type TEXT,
      size BIGINT,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function parsePlan(value: string): VideoProductionPlan {
  const plan = JSON.parse(value) as VideoProductionPlan;
  if (!Array.isArray(plan.scenes) || !plan.title) {
    throw new Error("El storyboard almacenado no es válido.");
  }
  return plan;
}

function map(row: ProductionRow): VideoProduction {
  return {
    ...row,
    plan: parsePlan(row.plan),
    size: row.size === null ? null : Number(row.size),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const columns = `id, fingerprint, source_content AS "sourceContent", platform, plan::text,
  status, provider_job_id AS "providerJobId", output_url AS "outputUrl",
  video_asset_id AS "videoAssetId", duration_seconds AS "durationSeconds", width, height,
  content_type AS "contentType", size, error, attempts, created_at, updated_at`;

export async function findProduction(input: ProductionInput) {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `SELECT ${columns} FROM video_productions WHERE fingerprint = $1`,
    [fingerprint(input)]
  );
  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function createProduction(input: ProductionInput, plan: VideoProductionPlan) {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `INSERT INTO video_productions (id, fingerprint, source_content, platform, plan, status)
     VALUES ($1, $2, $3, $4, $5::jsonb, 'queued')
     ON CONFLICT (fingerprint) DO NOTHING
     RETURNING ${columns}`,
    [randomUUID(), fingerprint(input), input.sourceContent, input.platform, JSON.stringify(plan)]
  );

  if (result.rows[0]) return { production: map(result.rows[0]), reused: false };
  const existing = await findProduction(input);
  if (!existing) throw new Error("No se pudo recuperar la producción duplicada.");
  return { production: existing, reused: true };
}

export async function getProduction(id: string) {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `SELECT ${columns} FROM video_productions WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function listProductions() {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `SELECT ${columns} FROM video_productions ORDER BY created_at DESC`
  );
  return result.rows.map(map);
}

export async function markProductionProcessing(id: string, providerJobId: string) {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `UPDATE video_productions
     SET status = 'processing', provider_job_id = $2, error = NULL,
         attempts = attempts + 1, updated_at = NOW()
     WHERE id = $1 AND status IN ('queued', 'failed')
     RETURNING ${columns}`,
    [id, providerJobId]
  );
  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function markProductionQueued(id: string, error: string) {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `UPDATE video_productions
     SET status = 'queued', error = $2, updated_at = NOW()
     WHERE id = $1 AND status <> 'completed'
     RETURNING ${columns}`,
    [id, error.slice(0, 1200)]
  );
  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function markProductionFailed(id: string, error: string) {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `UPDATE video_productions
     SET status = 'failed', error = $2, updated_at = NOW()
     WHERE id = $1 AND status <> 'completed'
     RETURNING ${columns}`,
    [id, error.slice(0, 1200)]
  );
  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function completeProduction(input: {
  id: string;
  outputUrl: string;
  videoAssetId: string;
  durationSeconds: number;
  width: number;
  height: number;
  contentType: string;
  size: number;
}) {
  await ensureTable();
  const result = await getPool().query<ProductionRow>(
    `UPDATE video_productions
     SET status = 'completed', output_url = $2, video_asset_id = $3,
         duration_seconds = $4, width = $5, height = $6, content_type = $7,
         size = $8, error = NULL, updated_at = NOW()
     WHERE id = $1 AND status = 'processing'
     RETURNING ${columns}`,
    [
      input.id,
      input.outputUrl,
      input.videoAssetId,
      input.durationSeconds,
      input.width,
      input.height,
      input.contentType,
      input.size,
    ]
  );
  return result.rows[0] ? map(result.rows[0]) : null;
}
