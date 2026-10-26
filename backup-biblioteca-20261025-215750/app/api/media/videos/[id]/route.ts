import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getVideo, markVideoDeleted, updateVideo } from "../../../../lib/server/media";

export const runtime = "nodejs";

const platforms = ["tiktok", "instagram", "facebook", "none"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "La solicitud no contiene JSON válido." }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "";
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().slice(0, 60)).filter(Boolean).slice(0, 20) : [];
  const platform = typeof body.platform === "string" && platforms.includes(body.platform as (typeof platforms)[number]) ? body.platform as (typeof platforms)[number] : "none";
  if (!title) return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  const video = await updateVideo((await params).id, { title, description, tags, platform });
  return video ? NextResponse.json({ ok: true, video }) : NextResponse.json({ error: "Video no encontrado." }, { status: 404 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (new URL(request.url).searchParams.get("confirm") !== "true") return NextResponse.json({ error: "Confirma la eliminación explícitamente." }, { status: 400 });
  const video = await getVideo((await params).id);
  if (!video) return NextResponse.json({ error: "Video no encontrado." }, { status: 404 });
  try { await del(video.url); } catch (error) { return NextResponse.json({ error: `No se pudo eliminar el archivo: ${error instanceof Error ? error.message : "error desconocido"}` }, { status: 502 }); }
  await markVideoDeleted(video.id);
  return NextResponse.json({ ok: true });
}
