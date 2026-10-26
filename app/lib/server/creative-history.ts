import { createHash, randomUUID } from "node:crypto";
import { getPool } from "./drafts";

export type CreativeGeneration = {
  id: string;
  fingerprint: string;
  brief: string;
  platform: string;
  objective: string;
  tone: string;
  content: string;
  createdAt: string;
};

type CreativeGenerationRow = {
  id: string;
  fingerprint: string;
  brief: string;
  platform: string;
  objective: string;
  tone: string;
  content: string;
  created_at: Date;
};

export type CreativeGenerationInput = Omit<
  CreativeGeneration,
  "id" | "fingerprint" | "content" | "createdAt"
>;

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("es-CO").replace(/\s+/g, " ");
}

export function creativeFingerprint(input: CreativeGenerationInput) {
  return createHash("sha256")
    .update(
      [input.brief, input.platform, input.objective, input.tone]
        .map(normalized)
        .join("\n")
    )
    .digest("hex");
}

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS creative_generations (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL UNIQUE,
      brief TEXT NOT NULL,
      platform TEXT NOT NULL,
      objective TEXT NOT NULL,
      tone TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function map(row: CreativeGenerationRow): CreativeGeneration {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    brief: row.brief,
    platform: row.platform,
    objective: row.objective,
    tone: row.tone,
    content: row.content,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findCreativeGeneration(
  input: CreativeGenerationInput
) {
  await ensureTable();
  const fingerprint = creativeFingerprint(input);
  const result = await getPool().query<CreativeGenerationRow>(
    `SELECT id, fingerprint, brief, platform, objective, tone, content, created_at
     FROM creative_generations WHERE fingerprint = $1`,
    [fingerprint]
  );
  return result.rows[0] ? map(result.rows[0]) : null;
}

export async function saveCreativeGeneration(
  input: CreativeGenerationInput,
  content: string
) {
  await ensureTable();
  const fingerprint = creativeFingerprint(input);
  const result = await getPool().query<CreativeGenerationRow>(
    `INSERT INTO creative_generations (
       id, fingerprint, brief, platform, objective, tone, content
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (fingerprint) DO UPDATE SET fingerprint = EXCLUDED.fingerprint
     RETURNING id, fingerprint, brief, platform, objective, tone, content, created_at`,
    [
      randomUUID(),
      fingerprint,
      input.brief,
      input.platform,
      input.objective,
      input.tone,
      content,
    ]
  );
  return map(result.rows[0]);
}
