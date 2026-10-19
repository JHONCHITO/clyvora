CREATE TABLE IF NOT EXISTS clyvora_login_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  resets_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS clyvora_content (
  id UUID PRIMARY KEY,
  owner_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 180),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 20000),
  platform TEXT NOT NULL CHECK (platform IN ('multiplatform','tiktok','facebook','instagram')),
  content_type TEXT NOT NULL CHECK (content_type IN ('text','meme','script','carousel','campaign')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status = 'draft'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS clyvora_content_owner_created_idx ON clyvora_content (owner_id, created_at DESC);
