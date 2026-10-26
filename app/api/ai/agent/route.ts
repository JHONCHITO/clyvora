
import { generateJhonContent, type JhonContext } from "../../../lib/server/jhon";

export const runtime = "nodejs";
export const maxDuration = 60;

type AgentRequest = {
  brief?: unknown;
  platform?: unknown;
  objective?: unknown;
  tone?: unknown;
};

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

export async function POST(request: Request) {
  let body: AgentRequest;

  try {
    body = (await request.json()) as AgentRequest;
  } catch {
    return Response.json(
      { error: "El cuerpo de la solicitud no es válido." },
      { status: 400 }
    );
  }

  const brief = cleanText(body.brief, 1500);
  const platform = cleanText(body.platform, 80);
  const objective = cleanText(body.objective, 120);
  const tone = cleanText(body.tone, 120);

  if (brief.length < 10) {
    return Response.json(
      { error: "Describe tu idea con al menos 10 caracteres." },
      { status: 400 }
    );
  }

  try {
    return Response.json({
      agent: "jhon",
      content: await generateJhonContent({ brief, platform, objective, tone } satisfies JhonContext),
    });
  } catch (error) {
    console.error(
      "Clyvora agent error:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    const message = error instanceof Error ? error.message : "No se pudo ejecutar el agente jhon.";
    const status = message.includes("aún no está configurada") ? 503 : 502;
    return Response.json({ error: message }, { status });
  }
}
