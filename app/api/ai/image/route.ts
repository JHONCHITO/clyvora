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
      timeout: 48_000,
      maxRetries: 0,
    });

    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt: [
        "Crea una imagen original, visualmente atractiva y bien compuesta.",
        "Adapta la composición al formato solicitado.",
        "Si es un meme, deja espacio para añadir texto legible después.",
        "No añadas marcas de agua ni logotipos inventados.",
        `Descripción: ${prompt}`,
      ].join("\n"),
      size:
        format === "landscape"
          ? "1536x1024"
          : format === "portrait"
            ? "1024x1536"
            : "1024x1024",
      quality: "low",
    });

    const imageBase64 = image.data?.[0]?.b64_json;

    if (!imageBase64) {
      console.error("OpenAI no devolvió b64_json para la imagen.");
      return Response.json(
        { error: "El proveedor no devolvió una imagen válida. Inténtalo de nuevo." },
        { status: 502 }
      );
    }

    return Response.json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error("Clyvora image generation failed:", error);

    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      return Response.json(
        { error: "La generación tardó demasiado. Intenta con una descripción más corta." },
        { status: 504 }
      );
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return Response.json(
          { error: "La clave de OpenAI no es válida. Revisa OPENAI_API_KEY en el servidor." },
          { status: 502 }
        );
      }

      if (error.status === 429) {
        return Response.json(
          { error: "Se alcanzó un límite de uso o facturación de OpenAI. Revisa tu cuenta." },
          { status: 429 }
        );
      }

      if (error.status === 400) {
        return Response.json(
          { error: "OpenAI rechazó la solicitud. Prueba con otra descripción." },
          { status: 400 }
        );
      }
    }

    return Response.json(
      { error: "No se pudo generar la imagen. Revisa los registros del servidor." },
      { status: 502 }
    );
  }
}
