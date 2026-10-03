import OpenAI from "openai";

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
  const body = (await request.json()) as GenerationRequest;
  const brief = text(body.brief, 1500);
  const platform = text(body.platform, 80);
  const objective = text(body.objective, 120);
  const tone = text(body.tone, 120);

  if (brief.length < 10) return Response.json({ error: "Describe tu idea con al menos 10 caracteres." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "La IA aún no está configurada en este entorno." }, { status: 503 });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions: [
        "Eres Clyvora, estratega de contenido social para crecimiento orgánico y responsable.",
        "Escribe en español claro. No prometas seguidores, no propongas automatización de follows, spam, cuentas falsas ni tácticas para evadir políticas.",
        "Devuelve Markdown breve y accionable con estas secciones exactas: IDEA CENTRAL, GANCHO, GUION, TEXTO PARA PUBLICAR, ADAPTACIÓN POR RED y LLAMADA A LA ACCIÓN.",
        "La adaptación por red debe respetar el formato y tono natural de TikTok, Instagram y Facebook cuando se solicite multiplataforma.",
      ].join(" "),
      input: `Brief: ${brief}\nCanal: ${platform || "Multiplataforma"}\nObjetivo: ${objective || "Crear comunidad"}\nTono: ${tone || "Cercano y experto"}`,
    });
    return Response.json({ content: response.output_text });
  } catch (error) {
    console.error("Clyvora AI generation failed", error);
    return Response.json({ error: "No se pudo generar el contenido en este momento. Intenta de nuevo." }, { status: 502 });
  }
}
