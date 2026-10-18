import { NextRequest, NextResponse } from "next/server";
import { upsertConnection } from "../../../../lib/server/social-connections";

export const runtime = "nodejs";

type TokenPayload = {
  access_token?: string; refresh_token?: string; open_id?: string; scope?: string;
  expires_in?: number; refresh_expires_in?: number; error?: string; error_description?: string;
  data?: TokenPayload;
};

type ProfilePayload = { data?: { user?: { open_id?: string; display_name?: string; avatar_url?: string } } };

function home(request: NextRequest, parameter: string, value: string) {
  const url = new URL("/", request.url);
  url.searchParams.set(parameter, value);
  return url;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const failure = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = request.cookies.get("clyvora_tiktok_oauth_state")?.value;

  if (failure || !code) return NextResponse.redirect(home(request, "social_error", searchParams.get("error_description") || "TikTok canceló la autorización."));
  if (!state || !savedState || state !== savedState) return NextResponse.redirect(home(request, "social_error", "La verificación de seguridad de TikTok no coincide. Intenta de nuevo."));

  try {
    const form = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI || "",
    });
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, cache: "no-store" });
    const tokenBody = (await tokenResponse.json()) as TokenPayload;
    const token = tokenBody.data || tokenBody;
    if (!tokenResponse.ok || !token.access_token || !token.open_id) throw new Error(token.error_description || token.error || "TikTok no entregó un token válido.");

    const profileResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
    const profile = (await profileResponse.json()) as ProfilePayload;
    const user = profile.data?.user;
    await upsertConnection("tiktok", {
      providerAccountId: user?.open_id || token.open_id,
      displayName: user?.display_name,
      avatarUrl: user?.avatar_url,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      accessTokenExpiresIn: token.expires_in,
      refreshTokenExpiresIn: token.refresh_expires_in,
      scopes: (token.scope || process.env.TIKTOK_SCOPES || "").split(",").filter(Boolean),
    });

    const response = NextResponse.redirect(home(request, "social_connected", "tiktok"));
    response.cookies.delete("clyvora_tiktok_oauth_state");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo completar la conexión con TikTok.";
    return NextResponse.redirect(home(request, "social_error", message));
  }
}
