import { getPublicConnections } from "../../../lib/server/social-connections";

export const runtime = "nodejs";

export async function GET() {
  try {
    const connections = await getPublicConnections();
    return Response.json({
      connections,
      setup: {
        database: Boolean(process.env.DATABASE_URL),
        tiktok: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET && process.env.TIKTOK_REDIRECT_URI && process.env.SOCIAL_TOKEN_ENCRYPTION_KEY),
        meta: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI),
      },
    });
  } catch {
    return Response.json({ connections: [], setup: { database: Boolean(process.env.DATABASE_URL), tiktok: false, meta: false } }, { status: 503 });
  }
}
