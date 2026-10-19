import { NextRequest, NextResponse } from 'next/server';
import { ownerFromSession, sameOrigin, SESSION_COOKIE } from './app/lib/server/owner-auth';

const publicPages = new Set(['/login', '/privacidad', '/privacy', '/terminos']);

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (publicPages.has(path) || path === '/api/session') return NextResponse.next();
  const owner = ownerFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!owner) {
    if (path.startsWith('/api/')) return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !sameOrigin(request)) {
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
