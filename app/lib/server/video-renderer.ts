import { timingSafeEqual } from "node:crypto";
import type { VideoProduction } from "./video-productions";

type RendererConfig = { url: string; apiKey: string; webhookSecret: string };

function configured(): RendererConfig | null {
  const url = process.env.VIDEO_RENDERER_URL;
  const apiKey = process.env.VIDEO_RENDERER_API_KEY;
  const webhookSecret = process.env.VIDEO_RENDERER_WEBHOOK_SECRET;
  if (!url || !apiKey || !webhookSecret) return null;

  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error("VIDEO_RENDERER_URL debe usar HTTPS.");
  }
  return { url: parsed.toString().replace(/\/$/, ""), apiKey, webhookSecret };
}

export function isRendererConfigured() {
  try {
    return Boolean(configured());
  } catch {
    return false;
  }
}

export async function enqueueRender(
  production: VideoProduction,
  callbackUrl: string
) {
  const config = configured();
  if (!config) {
    throw new Error(
      "No hay proveedor de renderizado configurado. Define VIDEO_RENDERER_URL, VIDEO_RENDERER_API_KEY y VIDEO_RENDERER_WEBHOOK_SECRET."
    );
  }

  const response = await fetch(`${config.url}/v1/productions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productionId: production.id,
      callbackUrl,
      format: { container: "mp4", width: 1080, height: 1920, aspectRatio: "9:16" },
      plan: production.plan,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const body = (await response.json().catch(() => null)) as
    | { jobId?: unknown; error?: unknown }
    | null;
  if (!response.ok || typeof body?.jobId !== "string" || !body.jobId) {
    throw new Error(
      typeof body?.error === "string"
        ? `El proveedor rechazó el trabajo: ${body.error.slice(0, 300)}`
        : "El proveedor de renderizado no aceptó el trabajo."
    );
  }
  return body.jobId;
}

export function validRendererSignature(rawBody: string, signature?: string) {
  const secret = configured()?.webhookSecret;
  if (!secret || !signature) return false;
  const expected = Buffer.from(
    (awaitedHmac(secret, rawBody))
  );
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function awaitedHmac(secret: string, body: string) {
  const { createHmac } = require("node:crypto") as typeof import("node:crypto");
  return createHmac("sha256", secret).update(body).digest("hex");
}
