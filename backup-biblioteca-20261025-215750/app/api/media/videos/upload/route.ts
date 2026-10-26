import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { isValidPanelSession, PANEL_COOKIE } from "../../../../lib/server/panel-auth";
import { upsertVideo } from "../../../../lib/server/media";

export const runtime = "nodejs";

const allowed = ["video/mp4", "video/webm", "video/quicktime"];
const maxSize = Number(process.env.MEDIA_MAX_UPLOAD_BYTES || 2 * 1024 * 1024 * 1024);

type UploadPayload = { title: string; description: string; tags: string[]; platform: "tiktok" | "instagram" | "facebook" | "none"; fingerprint: string; size: number };

function parsePayload(value: string | null | undefined): UploadPayload {
  if (!value) throw new Error("Faltan los metadatos de la carga.");
  const raw = JSON.parse(value) as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 160) : "";
  const description = typeof raw.description === "string" ? raw.description.trim().slice(0, 4000) : "";
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().slice(0, 60)).filter(Boolean).slice(0, 20) : [];
  const platform = raw.platform === "tiktok" || raw.platform === "instagram" || raw.platform === "facebook" ? raw.platform : "none";
  const fingerprint = typeof raw.fingerprint === "string" && raw.fingerprint.length <= 300 ? raw.fingerprint : "";
  const size = typeof raw.size === "number" && Number.isFinite(raw.size) && raw.size > 0 && raw.size <= maxSize ? raw.size : 0;
  if (!title || !fingerprint || !size) throw new Error("Los metadatos de la carga no son válidos.");
  return { title, description, tags, platform, fingerprint, size };
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Configura BLOB_READ_WRITE_TOKEN para habilitar cargas de video." }, { status: 503 });
  const body = await request.json() as HandleUploadBody;
  try {
    const result = await handleUpload({
      body, request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isValidPanelSession(request.cookies.get(PANEL_COOKIE)?.value)) throw new Error("Debes iniciar sesión para subir archivos.");
        const payload = parsePayload(clientPayload);
        if (!/\.(mp4|webm|mov)$/i.test(pathname)) throw new Error("El nombre del archivo debe terminar en .mp4, .webm o .mov.");
        return { allowedContentTypes: allowed, maximumSizeInBytes: maxSize, addRandomSuffix: true, tokenPayload: JSON.stringify(payload) };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parsePayload(tokenPayload);
        if (!allowed.includes(blob.contentType)) throw new Error("El almacenamiento informó un tipo de video no permitido.");
        await upsertVideo({ title: payload.title, description: payload.description, tags: payload.tags, platform: payload.platform, url: blob.url, pathname: blob.pathname, contentType: blob.contentType, size: payload.size, fingerprint: payload.fingerprint });
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo preparar la carga." }, { status: 400 });
  }
}
