import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../lib/server/database';
import { ownerFromSession, readSmallJson, sameOrigin, SESSION_COOKIE } from '../../lib/server/owner-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(request: NextRequest) {
  const owner = ownerFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!owner) return reply({ error: 'Inicia sesión.' }, 401);
  try {
    const result = await database().query('SELECT id, title, body, platform, content_type, status, created_at FROM clyvora_content WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 50', [owner]);
    return reply({ items: result.rows });
  } catch { return reply({ error: 'No se pudieron consultar los borradores. Revisa las migraciones.' }, 503); }
}

export async function POST(request: NextRequest) {
  const owner = ownerFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!owner) return reply({ error: 'Inicia sesión.' }, 401);
  if (!sameOrigin(request)) return reply({ error: 'Origen no autorizado.' }, 403);
  const key = request.headers.get('Idempotency-Key') || '';
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) return reply({ error: 'Incluye una clave Idempotency-Key de 16 a 100 caracteres.' }, 400);
  let input: unknown;
  try { input = await readSmallJson(request); } catch { return reply({ error: 'JSON no válido o demasiado grande.' }, 400); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply({ error: 'Datos no válidos.' }, 400);
  const data = input as Record<string, unknown>;
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const body = typeof data.body === 'string' ? data.body.trim() : '';
  const platform = data.platform === undefined ? 'multiplatform' : data.platform;
  const contentType = data.contentType === undefined ? 'text' : data.contentType;
  if (!title || title.length > 180 || !body || body.length > 20000 || typeof platform !== 'string' || !['multiplatform', 'tiktok', 'facebook', 'instagram'].includes(platform) || typeof contentType !== 'string' || !['text', 'meme', 'script', 'carousel', 'campaign'].includes(contentType)) return reply({ error: 'Revisa título, contenido, plataforma y tipo.' }, 400);
  const fingerprint = createHash('sha256').update(JSON.stringify({ title, body, platform, contentType })).digest('hex');
  try {
    const inserted = await database().query(`INSERT INTO clyvora_content (id, owner_id, idempotency_key, fingerprint, title, body, platform, content_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (owner_id, idempotency_key) DO NOTHING RETURNING id, title, body, platform, content_type, status, created_at`, [randomUUID(), owner, key, fingerprint, title, body, platform, contentType]);
    if (inserted.rowCount) return reply({ item: inserted.rows[0], published: false }, 201);
    const existing = await database().query('SELECT id, title, body, platform, content_type, status, created_at, fingerprint FROM clyvora_content WHERE owner_id = $1 AND idempotency_key = $2', [owner, key]);
    const row = existing.rows[0];
    if (!row || row.fingerprint !== fingerprint) return reply({ error: 'La clave ya se usó para contenido diferente.' }, 409);
    const { fingerprint: ignored, ...item } = row;
    return reply({ item, published: false, reused: true });
  } catch { return reply({ error: 'No se pudo guardar. Conserva el texto y reintenta con la misma clave.' }, 503); }
}
