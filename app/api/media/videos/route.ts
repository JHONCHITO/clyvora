import { NextRequest, NextResponse } from "next/server";
import {
  isValidPanelSession,
  PANEL_COOKIE,
} from "../../../lib/server/panel-auth";
import { listVideos } from "../../../lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isValidPanelSession(request.cookies.get(PANEL_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para acceder a la biblioteca." },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const videos = await listVideos();

    return NextResponse.json(
      { videos },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error(
      "Error consultando videos:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    return NextResponse.json(
      { error: "No se pudieron cargar los videos. Revisa la conexión a la base de datos." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
