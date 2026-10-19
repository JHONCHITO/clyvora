
import OpenAI from "openai";

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

  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_AGENT_ID) {
    return Response.json(
      { error: "Falta configurar OPENAI_API_KEY u OPENAI_AGENT_ID." },
      { status: 503 }
    );
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const events = await client.beta.agents.sessions.create({
      agent_id: process.env.OPENAI_AGENT_ID,
      environment: { type: "none" },
      input: [
        "Trabaja como asistente de Clyvora.",
        "Prepara contenido responsable para redes sociales.",
        `Idea: ${brief}`,
        `Plataforma: ${platform || "Multiplataforma"}`,
        `Objetivo: ${objective || "Crear comunidad"}`,
        `Tono: ${tone || "Cercano y profesional"}`,
        "Entrega una propuesta de contenido clara y accionable.",
        "No publiques nada ni ejecutes acciones externas.",
      ].join("\n"),
      stream: true,
    });

    events.withResultCollection();

    for await (const _event of events) {
      // Consumimos los eventos hasta que finalice la tarea.
    }

    const result = await events.finalResult();

    if (!result.output_text?.trim()) {
      return Response.json(
        { error: "El agente terminó sin devolver texto." },
        { status: 502 }
      );
    }

    return Response.json({
      content: result.output_text,
      sessionId: result.session_id,
    });
  } catch (error) {
    console.error(
      "Clyvora agent error:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    return Response.json(
      { error: "No se pudo ejecutar el agente de Clyvora." },
      { status: 502 }
    );
  }
}
