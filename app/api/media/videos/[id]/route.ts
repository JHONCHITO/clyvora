import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import {
  isValidPanelSession,
  PANEL_COOKIE,
} from "../../../../lib/server/panel-auth";
import {
  getVideo,
  markVideoDeleted,
  updateVideo,
} from "../../../../lib/server/media";

export const runtime = "nodejs";

const platforms = ["tiktok", "instagram", "facebook", "none"] as const;

function authorized(request: NextRequest) {
  return isValidPanelSession(request.cookies.get(PANEL_COOKIE)?.value);
}

function unauthorized() {
  return NextResponse.json(
    { error: "Debes iniciar sesión para administrar los videos." },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorized(request)) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 4000)
        : "";
    const tags = Array.isArray(body.tags)
      ? body.tags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 20)
      : [];

    const platform =
      typeof body.platform === "string" &&
      platforms.includes(body.platform as (typeof platforms)[number])
        ? (body.platform as (typeof platforms)[number])
        : "none";

    if (!title) {
      return NextResponse.json(
        { error: "El título es obligatorio." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const video = await updateVideo(id, {
      title,
      description,
      tags,
      platform,
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, video },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Error actualizando video:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    return NextResponse.json(
      { error: "No se pudo actualizar el video." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorized(request)) return unauthorized();

  if (request.nextUrl.searchParams.get("confirm") !== "true") {
    return NextResponse.json(
      { error: "Confirma la eliminación explícitamente." },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const video = await getVideo(id);

    if (!video) {
      return NextResponse.json(
        { error: "Video no encontrado." },
        { status: 404 }
      );
    }

    await del(video.url);

    const deleted = await markVideoDeleted(video.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "El archivo se eliminó, pero no se pudo actualizar su registro." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Error eliminando video:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    return NextResponse.json(
      { error: "No se pudo completar la eliminación del video." },
      { status: 500 }
    );
  }
}
