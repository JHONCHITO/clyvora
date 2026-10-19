import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../lib/server/database';
import { authConfigured, issueOwnerSession, ownerFromSession, readSmallJson, sameOrigin, SESSION_COOKIE, SESSION_SECONDS, verifyOwnerPassword } from '../../lib/server/owner-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  return reply({ authenticated: Boolean(ownerFromSession(request.cookies.get(SESSION_COOKIE)?.value)), configured: authConfigured() });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: 'Origen no autorizado.' }, 403);
  if (!authConfigured()) return reply({ error: 'El acceso privado necesita configurarse en el servidor.' }, 503);
  let body: unknown;
  try { body = await readSmallJson(request); } catch { return reply({ error: 'Solicitud JSON no válida.' }, 400); }
  if (!body || typeof body !== 'object' || !('password' in body) || typeof body.password !== 'string' || body.password.length > 512) return reply({ error: 'Solicitud no válida.' }, 400);
  try {
    const limit = await database().query(`
      INSERT INTO clyvora_login_limits (key, attempts, resets_at)
      VALUES ('owner-login', 1, NOW() + INTERVAL '15 minutes')
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN clyvora_login_limits.resets_at <= NOW() THEN 1 ELSE clyvora_login_limits.attempts + 1 END,
        resets_at = CASE WHEN clyvora_login_limits.resets_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE clyvora_login_limits.resets_at END
      WHERE clyvora_login_limits.resets_at <= NOW() OR clyvora_login_limits.attempts < 10
      RETURNING attempts
    `);
    if (!limit.rowCount) return reply({ error: 'Demasiados intentos. Espera 15 minutos.' }, 429);
    if (!await verifyOwnerPassword(body.password)) return reply({ error: 'Credenciales incorrectas.' }, 401);
    const response = reply({ authenticated: true });
    response.cookies.set(SESSION_COOKIE, issueOwnerSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: SESSION_SECONDS, path: '/' });
    return response;
  } catch { return reply({ error: 'No se pudo iniciar sesión. Revisa la conexión y las migraciones del servidor.' }, 503); }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: 'Origen no autorizado.' }, 403);
  const response = reply({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}
