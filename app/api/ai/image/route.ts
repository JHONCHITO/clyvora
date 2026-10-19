import OpenAI from "openai";
 
export const runtime = "nodejs";
 
type IdeaRequest = { brief?: unknown; platform?: unknown; tone?: unknown };
 
function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}
 
function parseIdea(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const data = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const hashtags = Array.isArray(data.hashtags)
      ? data.hashtags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean).slice(0, 8)
      : [];
    const idea = {
      caption: text(data.caption, 1200),
      hashtags,
      imagePrompt: text(data.imagePrompt, 1500),
      memeTop: text(data.memeTop, 80),
      memeBottom: text(data.memeBottom, 80),
    };
    return idea.caption && idea.imagePrompt ? idea : null;
  } catch {
    return null;
  }
}
 
export async function POST(request: Request) {
  const body = (await request.json()) as IdeaRequest;
  const brief = text(body.brief, 1500);
  const platform = text(body.platform, 80);
  const tone = text(body.tone, 120);
 
  if (brief.length < 10) return Response.json({ error: "Describe tu idea con al menos 10 caracteres." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "La IA aún no está configurada en este entorno." }, { status: 503 });
 
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions: [
        "Eres Clyvora, creador de contenido social original, divertido y responsable.",
        "Responde SOLO con un objeto JSON válido, sin Markdown ni texto adicional, con exactamente estas claves:",
        '"caption" (texto listo para publicar, en español, natural para la red indicada, máximo 600 caracteres),',
        '"hashtags" (lista de 5 hashtags relevantes, sin repetir),',
        '"imagePrompt" (descripción en español de una escena visual original y llamativa para generar la imagen; sin texto escrito, sin logotipos, sin personas reales ni personajes con derechos de autor),',
        '"memeTop" (frase corta y graciosa de máximo 60 caracteres para la parte superior de la imagen),',
        '"memeBottom" (remate corto de máximo 60 caracteres para la parte inferior).',
        "No prometas seguidores ni resultados, no inventes datos, no uses spam ni tácticas para evadir las políticas de las plataformas.",
      ].join(" "),
      input: `Idea: ${brief}\nRed: ${platform || "TikTok"}\nTono: ${tone || "Cercano y experto"}`,
    });
 
    const idea = parseIdea(response.output_text);
    if (!idea) return Response.json({ error: "La IA devolvió una respuesta que no se pudo leer. Intenta de nuevo." }, { status: 502 });
    return Response.json({ idea });
  } catch (error) {
    console.error("Clyvora idea generation failed", error);
    return Response.json({ error: "No se pudo generar la idea en este momento. Intenta de nuevo." }, { status: 502 });
  }
}