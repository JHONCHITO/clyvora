import { generateJhonIdea, type JhonContext } from "../../../lib/server/jhon";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "La solicitud no contiene JSON válido." }, { status: 400 });
  }

  const context: JhonContext = {
    brief: cleanText(body.brief, 1500),
    platform: cleanText(body.platform, 80),
    tone: cleanText(body.tone, 120),
  };

  if (context.brief.length < 10) {
    return Response.json(
      { error: "Describe tu idea con al menos 10 caracteres." },
      { status: 400 }
    );
  }

  try {
    return Response.json({ idea: await generateJhonIdea(context) });
  } catch (error) {
    console.error("Clyvora idea generation failed:", error instanceof Error ? error.message : "Error desconocido");
    const message = error instanceof Error ? error.message : "No se pudo crear la idea.";
    const status = message.includes("aún no está configurada") ? 503 : 502;
    return Response.json({ error: message }, { status });
  }
}
