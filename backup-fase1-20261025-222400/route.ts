import { generateJhonContent, type JhonContext } from "../../../lib/server/jhon";

export const runtime = "nodejs";

type GenerationRequest = {
  brief?: unknown;
  platform?: unknown;
  objective?: unknown;
  tone?: unknown;
};

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: Request) {
  let body: GenerationRequest;
  try {
    body = (await request.json()) as GenerationRequest;
  } catch {
    return Response.json({ error: "La solicitud no contiene JSON válido." }, { status: 400 });
  }

  const brief = text(body.brief, 1500);
  const platform = text(body.platform, 80);
  const objective = text(body.objective, 120);
  const tone = text(body.tone, 120);

  if (brief.length < 10) return Response.json({ error: "Describe tu idea con al menos 10 caracteres." }, { status: 400 });
  try {
    const context: JhonContext = { brief, platform, objective, tone };
    return Response.json({ content: await generateJhonContent(context) });
  } catch (error) {
    console.error("Clyvora AI generation failed", error instanceof Error ? error.message : "Error desconocido");
    const message = error instanceof Error ? error.message : "No se pudo generar el contenido en este momento. Intenta de nuevo.";
    const status = message.includes("aún no está configurada") ? 503 : 502;
    return Response.json({ error: message }, { status });
  }
}
