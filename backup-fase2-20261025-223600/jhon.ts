import OpenAI from "openai";

export type JhonContext = {
  brief: string;
  platform?: string;
  objective?: string;
  tone?: string;
};

export type JhonIdea = {
  caption: string;
  hashtags: string[];
  imagePrompt: string;
  memeTop: string;
  memeBottom: string;
};

function client() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("La IA aún no está configurada en este entorno.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function contextText(context: JhonContext) {
  return [
    `Brief: ${context.brief}`,
    `Canal: ${context.platform || "Multiplataforma"}`,
    `Objetivo: ${context.objective || "Crear comunidad"}`,
    `Tono: ${context.tone || "Cercano y experto"}`,
  ].join("\n");
}

async function askJhon(instructions: string, input: string) {
  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    instructions: [
      "Eres jhon, el agente central de Clyvora.",
      "Ayudas a planear y crear contenido original, útil y responsable para redes sociales.",
      "Nunca afirmas que publicaste, programaste o analizaste datos si no existe una integración oficial que lo confirme.",
      "No propones spam, seguidores falsos, automatización de follows ni evasión de políticas.",
      instructions,
    ].join(" "),
    input,
  });

  if (!response.output_text?.trim()) {
    throw new Error("jhon terminó sin devolver contenido.");
  }

  return response.output_text.trim();
}

export async function generateJhonContent(context: JhonContext) {
  return askJhon(
    [
      "Escribe en español claro.",
      "Devuelve Markdown breve y accionable con estas secciones exactas: IDEA CENTRAL, GANCHO, GUION, SORPRESA O REMATE, TEXTO PARA PUBLICAR, ADAPTACIÓN POR RED y LLAMADA A LA ACCIÓN.",
      "El GUION debe describir una estructura de video vertical con gancho inicial, desarrollo y duración sugerida. No afirmes que existe un video final, voz, música o subtítulos si no se han producido mediante un servicio configurado.",
      "La adaptación por red debe respetar el formato y tono natural de TikTok, Instagram y Facebook cuando se solicite multiplataforma.",
    ].join(" "),
    contextText(context)
  );
}

function asText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`jhon no devolvió ${field} en un formato válido.`);
  }

  return value.trim().slice(0, maxLength);
}

function parseIdea(raw: string): JhonIdea {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || raw;
  const object = fenced.match(/\{[\s\S]*\}/)?.[0];

  if (!object) {
    throw new Error("jhon no devolvió la idea en JSON válido.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(object) as Record<string, unknown>;
  } catch {
    throw new Error("jhon no devolvió la idea en JSON válido.");
  }

  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 12)
    : [];

  if (!hashtags.length) {
    throw new Error("jhon no devolvió hashtags válidos.");
  }

  return {
    caption: asText(parsed.caption, "el texto para publicar", 2200),
    hashtags,
    imagePrompt: asText(parsed.imagePrompt, "la dirección visual", 3000),
    memeTop: typeof parsed.memeTop === "string" ? parsed.memeTop.trim().slice(0, 160) : "",
    memeBottom:
      typeof parsed.memeBottom === "string"
        ? parsed.memeBottom.trim().slice(0, 160)
        : "",
  };
}

export async function generateJhonIdea(context: JhonContext) {
  const raw = await askJhon(
    [
      "Devuelve exclusivamente un objeto JSON válido, sin Markdown ni texto adicional.",
      'Usa exactamente estas claves: {"caption":"...","hashtags":["..."],"imagePrompt":"...","memeTop":"...","memeBottom":"..."}.',
      "caption debe ser un texto listo para publicar; hashtags debe tener entre 3 y 8 etiquetas sin #; imagePrompt debe describir una imagen original sin texto ni logotipos; memeTop y memeBottom son frases breves opcionales, adecuadas para superponer sobre una imagen.",
    ].join(" "),
    contextText(context)
  );

  return parseIdea(raw);
}
