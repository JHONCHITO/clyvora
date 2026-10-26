
import { NextRequest, NextResponse } from "next/server";
import {
  isValidPanelSession,
  PANEL_COOKIE,
} from "./app/lib/server/panel-auth";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/login",
  "/api/oauth/tiktok/callback",
  "/api/media/videos/upload",
  "/api/health",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const validSession = isValidPanelSession(
    request.cookies.get(PANEL_COOKIE)?.value
  );

  if (pathname === "/login") {
    if (validSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!validSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para acceder." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
