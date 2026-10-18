import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const required = ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI", "DATABASE_URL", "SOCIAL_TOKEN_ENCRYPTION_KEY"] as const;

export async function GET(request: NextRequest) {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    const url = new URL("/", request.url);
    url.searchParams.set("social_error", `Falta configurar: ${missing.join(", ")}`);
    return NextResponse.redirect(url);
  }

  const state = randomBytes(32).toString("base64url");
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", process.env.TIKTOK_SCOPES || "user.info.basic");
  authUrl.searchParams.set("redirect_uri", process.env.TIKTOK_REDIRECT_URI!);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("disable_auto_auth", "1");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("clyvora_tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
