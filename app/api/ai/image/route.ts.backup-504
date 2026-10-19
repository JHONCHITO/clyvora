
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

type ImageRequest = {
  prompt?: unknown;
  format?: unknown;
};

function cleanText(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: Request) {
  let body: ImageRequest;

  try {
    body = (await request.json()) as ImageRequest;
  } catch {
    return Response.json(
      { error: "La solicitud no contiene un JSON válido." },
      { status: 400 }
    );
  }

  const prompt = cleanText(body.prompt, 4000);
  const format = cleanText(body.format, 30).toLowerCase();

  if (prompt.length < 10) {
    return Response.json(
      { error: "Escribe una descripción de al menos 10 caracteres." },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Falta configurar OPENAI_API_KEY en el servidor." },
      { status: 503 }
    );
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt: [
        "Crea una imagen original, visualmente atractiva y de alta calidad.",
        "La imagen debe estar bien compuesta y adaptarse al formato solicitado.",
        "Si la descripción corresponde a un meme, deja espacio para añadir texto legible posteriormente.",
        "No añadas marcas de agua ni logotipos inventados.",
        `Descripción: ${prompt}`,
      ].join("\n"),
      size: format === "landscape" ? "1536x1024" :
            format === "portrait" ? "1024x1536" :
            "1024x1024",
    });

    const imageBase64 = image.data?.[0]?.b64_json;

    if (!imageBase64) {
      return Response.json(
        { error: "OpenAI no devolvió los datos de la imagen." },
        { status: 502 }
      );
    }

    return Response.json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error("Clyvora image generation failed:", error);

    if (error instanceof OpenAI.APIError) {
      const status = error.status;

      if (status === 401) {
        return Response.json(
          { error: "La clave de OpenAI no es válida. Revisa OPENAI_API_KEY." },
          { status: 502 }
        );
      }

      if (status === 429) {
        return Response.json(
          { error: "Se alcanzó un límite de uso o de facturación de OpenAI. Revisa tu cuenta." },
          { status: 429 }
        );
      }
    }

    return Response.json(
      { error: "No se pudo generar la imagen. Revisa el registro del servidor e inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
