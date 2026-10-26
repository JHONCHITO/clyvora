import { NextResponse } from "next/server";
import { listVideos } from "../../../lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ videos: await listVideos() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error consultando videos:", error instanceof Error ? error.message : "Error desconocido");
    return NextResponse.json({ error: "No se pudieron cargar los videos. Configura DATABASE_URL para activar la biblioteca." }, { status: 503 });
  }
}
