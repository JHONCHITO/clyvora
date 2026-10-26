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

export type VideoScene = {
  order: number;
  durationSeconds: number;
  visualPrompt: string;
  narration: string;
  subtitle: string;
};

export type VideoProductionPlan = {
  title: string;
  description: string;
  hashtags: string[];
  coverPrompt: string;
  durationSeconds: number;
  scenes: VideoScene[];
  musicDirection: string;
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

function parseVideoPlan(raw: string): VideoProductionPlan {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || raw;
  const object = fenced.match(/\{[\s\S]*\}/)?.[0];
  if (!object) throw new Error("jhon no devolvió un plan de video en JSON válido.");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(object) as Record<string, unknown>;
  } catch {
    throw new Error("jhon no devolvió un plan de video en JSON válido.");
  }

  const scenes = Array.isArray(parsed.scenes)
    ? parsed.scenes.slice(0, 8).map((scene, index) => {
        const value = scene as Record<string, unknown>;
        const duration = Number(value.durationSeconds);
        return {
          order: index + 1,
          durationSeconds: Number.isFinite(duration)
            ? Math.min(20, Math.max(2, Math.round(duration)))
            : 5,
          visualPrompt: asText(value.visualPrompt, `la escena ${index + 1}`, 1400),
          narration: asText(value.narration, `la narración ${index + 1}`, 700),
          subtitle: asText(value.subtitle, `el subtítulo ${index + 1}`, 700),
        };
      })
    : [];

  if (scenes.length < 2) {
    throw new Error("jhon debe proponer al menos dos escenas para el video.");
  }

  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  if (hashtags.length < 3) {
    throw new Error("jhon no devolvió hashtags suficientes para el video.");
  }

  return {
    title: asText(parsed.title, "el título", 150),
    description: asText(parsed.description, "la descripción", 2200),
    hashtags,
    coverPrompt: asText(parsed.coverPrompt, "la portada", 1400),
    durationSeconds: scenes.reduce((total, scene) => total + scene.durationSeconds, 0),
    scenes,
    musicDirection:
      typeof parsed.musicDirection === "string"
        ? parsed.musicDirection.trim().slice(0, 500)
        : "Sin música: añade únicamente una pista con licencia cuando el proveedor esté configurado.",
  };
}

export async function generateJhonVideoPlan(input: {
  sourceContent: string;
  platform: string;
}) {
  const raw = await askJhon(
    [
      "Devuelve exclusivamente JSON válido, sin Markdown.",
      'Usa exactamente: {"title":"...","description":"...","hashtags":["..."],"coverPrompt":"...","scenes":[{"durationSeconds":5,"visualPrompt":"...","narration":"...","subtitle":"..."}],"musicDirection":"..."}.',
      "Crea un storyboard original para un video vertical 9:16 listo para TikTok, entre 15 y 60 segundos y de 2 a 8 escenas.",
      "La primera escena debe ser un gancho; las escenas centrales desarrollan la idea; la última contiene sorpresa o remate y una llamada a la acción.",
      "visualPrompt debe describir una imagen original sin texto, marcas ni logotipos. narration y subtitle deben coincidir. No afirmes que las imágenes, voz, subtítulos, música o video ya fueron generados.",
      "musicDirection solo puede orientar una pista autorizada; si no hay fuente licenciada, debe indicar que no se añadirá música.",
    ].join(" "),
    `Canal: ${input.platform}\nContenido fuente:\n${input.sourceContent}`
  );

  return parseVideoPlan(raw);
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
