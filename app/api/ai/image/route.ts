import OpenAI from "openai";

export const runtime = "nodejs";

const sizes: Record<string, "1024x1536" | "1024x1024" | "1536x1024"> = {
  "Vertical · Reels / Stories": "1024x1536",
  "Cuadrado · Feed": "1024x1024",
  "Horizontal · Facebook": "1536x1024",
};

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: unknown; format?: unknown };
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 1800) : "";
  const format = typeof body.format === "string" ? body.format : "";
  if (prompt.length < 10) return Response.json({ error: "Describe la imagen con al menos 10 caracteres." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "La IA aún no está configurada en este entorno." }, { status: 503 });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
      prompt: `Crea una imagen para contenido social. ${prompt}. No incluyas texto, logotipos ni marcas de agua.`,
      size: sizes[format] || "1024x1024",
      quality: "low",
      output_format: "png",
    });
    const image = result.data?.[0]?.b64_json;
    if (!image) return Response.json({ error: "La API no devolvió una imagen." }, { status: 502 });
    return Response.json({ image: `data:image/png;base64,${image}` });
  } catch (error) {
    console.error("Clyvora image generation failed", error);
    return Response.json({ error: "No se pudo generar la imagen. Revisa tu clave, permisos de API o cuota." }, { status: 502 });
  }
}
