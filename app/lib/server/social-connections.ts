import { Pool } from "pg";
import { encryptSecret } from "./crypto";

type Provider = "tiktok" | "instagram" | "facebook";

export type PublicConnection = {
  provider: Provider;
  providerAccountId: string;
  displayName: string | null;
  avatarUrl: string | null;
  scopes: string[];
  connectedAt: string;
};

type TokenInput = {
  providerAccountId: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
  scopes: string[];
};

declare global {
  // eslint-disable-next-line no-var
  var clyvoraSocialPool: Pool | undefined;
}

function databaseUrl() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL. Conecta una base PostgreSQL en Vercel.");
  return process.env.DATABASE_URL;
}

function pool() {
  if (!global.clyvoraSocialPool) {
    global.clyvoraSocialPool = new Pool({ connectionString: databaseUrl(), ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
  }
  return global.clyvoraSocialPool;
}

async function ensureTable() {
  await pool().query(`
    CREATE TABLE IF NOT EXISTS social_connections (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      access_token_encrypted TEXT NOT NULL,
      refresh_token_encrypted TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scopes TEXT NOT NULL DEFAULT '',
      connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(provider, provider_account_id)
    );
  `);
}

function dateAfter(seconds?: number) {
  return seconds ? new Date(Date.now() + seconds * 1000) : null;
}

export async function upsertConnection(provider: Provider, input: TokenInput) {
  await ensureTable();
  const id = `${provider}:${input.providerAccountId}`;
  const query = `
    INSERT INTO social_connections (
      id, provider, provider_account_id, display_name, avatar_url,
      access_token_encrypted, refresh_token_encrypted,
      access_token_expires_at, refresh_token_expires_at, scopes, connected_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    ON CONFLICT (provider, provider_account_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
      access_token_expires_at = EXCLUDED.access_token_expires_at,
      refresh_token_expires_at = EXCLUDED.refresh_token_expires_at,
      scopes = EXCLUDED.scopes,
      updated_at = NOW();
  `;
  await pool().query(query, [
    id,
    provider,
    input.providerAccountId,
    input.displayName || null,
    input.avatarUrl || null,
    encryptSecret(input.accessToken),
    input.refreshToken ? encryptSecret(input.refreshToken) : null,
    dateAfter(input.accessTokenExpiresIn),
    dateAfter(input.refreshTokenExpiresIn),
    input.scopes.join(","),
  ]);
}

export async function getPublicConnections(): Promise<PublicConnection[]> {
  if (!process.env.DATABASE_URL) return [];
  await ensureTable();
  const result = await pool().query<{
    provider: Provider; provider_account_id: string; display_name: string | null; avatar_url: string | null; scopes: string; connected_at: Date;
  }>("SELECT provider, provider_account_id, display_name, avatar_url, scopes, connected_at FROM social_connections ORDER BY connected_at DESC");
  return result.rows.map((row) => ({
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    scopes: row.scopes ? row.scopes.split(",").filter(Boolean) : [],
    connectedAt: row.connected_at.toISOString(),
  }));
}
