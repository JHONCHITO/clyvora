"use client";

import { FormEvent, useEffect, useState } from "react";

const briefExamples = [
  "Explica cómo mi servicio resuelve un problema cotidiano en menos de un minuto.",
  "Cuenta la historia real de por qué nació mi marca, con un tono cercano.",
  "Crea una mini guía con tres consejos prácticos para mi audiencia.",
];

type Props = {
  onCreateDraft: (content: string) => void;
  initialBrief?: string;
};

type Idea = {
  caption: string;
  hashtags: string[];
  imagePrompt: string;
  memeTop: string;
  memeBottom: string;
};

type CreativeMode = "copy" | "image" | "full";

export function AiStudio({ onCreateDraft, initialBrief }: Props) {
  const [brief, setBrief] = useState(initialBrief || briefExamples[0]);
  const [creativeMode, setCreativeMode] = useState<CreativeMode>("full");

  useEffect(() => {
    if (initialBrief) {
      setBrief(initialBrief);
      setCreativeMode("full");
    }
  }, [initialBrief]);

  return (
    <section className="studio-layout">
      <div className="studio-intro">
        <div>
          <p className="eyebrow">COPILOTO CREATIVO</p>
          <h2>Tu estudio de contenido con IA</h2>
          <p>
            Convierte una idea en un guion, textos nativos para cada plataforma
            y una publicación lista para revisar.
          </p>
        </div>

        <span className="ai-status">
          <i /> IA preparada
        </span>
      </div>

      <div className="studio-tabs" role="tablist">
        <button
          type="button"
          className={creativeMode === "full" ? "tab active" : "tab"}
          onClick={() => setCreativeMode("full")}
        >
          ★ Idea completa
        </button>

        <button
          type="button"
          className={creativeMode === "copy" ? "tab active" : "tab"}
          onClick={() => setCreativeMode("copy")}
        >
          ✦ Crear contenido
        </button>

        <button
          type="button"
          className={creativeMode === "image" ? "tab active" : "tab"}
          onClick={() => setCreativeMode("image")}
        >
          ◉ Crear imagen
        </button>
      </div>

      {creativeMode === "full" && (
        <FullIdeaStudio
          brief={brief}
          onBriefChange={setBrief}
          onCreateDraft={onCreateDraft}
        />
      )}

      {creativeMode === "copy" && (
        <>
          <CopyStudio
            brief={brief}
            onBriefChange={setBrief}
            onCreateDraft={onCreateDraft}
          />

          <section className="workflow panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SISTEMA DE CRECIMIENTO</p>
                <h3>De una idea a una comunidad</h3>
              </div>
              <span className="badge">Control humano</span>
            </div>

            <div className="workflow-steps">
              <div>
                <span>01</span>
                <b>Investiga</b>
                <p>Registra tus temas, audiencia y objetivos.</p>
              </div>
              <i>→</i>
              <div>
                <span>02</span>
                <b>La IA propone</b>
                <p>Crea guiones, copys y variantes nativas.</p>
              </div>
              <i>→</i>
              <div>
                <span>03</span>
                <b>Tú apruebas</b>
                <p>Edita cada pieza antes de programarla.</p>
              </div>
              <i>→</i>
              <div>
                <span>04</span>
                <b>Aprende</b>
                <p>Convierte resultados en mejores decisiones.</p>
              </div>
            </div>
          </section>
        </>
      )}

      {creativeMode === "image" && (
        <ImageStudio onCreateDraft={onCreateDraft} />
      )}
    </section>
  );
}

async function readApiResponse<T>(
  response: Response,
  fallbackError: string
): Promise<T> {
  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `La API respondió ${response.status}: ${raw || fallbackError}`
    );
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`La API devolvió una respuesta inválida: ${raw}`);
  }
}

function CopyStudio({
  brief,
  onBriefChange,
  onCreateDraft,
}: Pick<Props, "onCreateDraft"> & {
  brief: string;
  onBriefChange: (value: string) => void;
}) {
  const [platform, setPlatform] = useState("Multiplataforma");
  const [objective, setObjective] = useState("Crear comunidad");
  const [tone, setTone] = useState("Cercano y experto");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyNotice, setHistoryNotice] = useState("");

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult("");
    setHistoryNotice("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, platform, objective, tone }),
      });

      const data = await readApiResponse<{
        content?: string;
        error?: string;
        generation?: { reused?: boolean; persisted?: boolean };
      }>(response, "No fue posible generar el contenido.");

      if (!data.content) {
        throw new Error(data.error || "No fue posible generar el contenido.");
      }

      setResult(data.content);
      if (data.generation?.reused) {
        setHistoryNotice("Se recuperó la propuesta equivalente de tu historial.");
      } else if (data.generation?.persisted) {
        setHistoryNotice("Propuesta guardada en el historial creativo.");
      } else {
        setHistoryNotice(
          "La propuesta no se guardó en historial: configura DATABASE_URL para activar la persistencia."
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function copyResult() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="studio-grid">
      <form className="studio-form panel" onSubmit={generate}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">BRIEF CREATIVO</p>
            <h3>¿Qué quieres comunicar?</h3>
          </div>
          <span className="step">01</span>
        </div>

        <label className="field-label">
          Cuéntale la idea a Clyvora
          <textarea
            value={brief}
            onChange={(event) => onBriefChange(event.target.value)}
            minLength={10}
            maxLength={1500}
            placeholder="Describe el tema, producto, experiencia o mensaje que quieres compartir."
            required
          />
        </label>

        <div className="quick-ideas">
          <span>Prueba una idea:</span>

          {briefExamples.map((example) => (
            <button
              type="button"
              key={example}
              onClick={() => onBriefChange(example)}
            >
              ✦ {example.slice(0, 29)}…
            </button>
          ))}
        </div>

        <div className="field-grid">
          <label className="field-label">
            Canal
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            >
              <option>Multiplataforma</option>
              <option>TikTok</option>
              <option>Instagram</option>
              <option>Facebook</option>
            </select>
          </label>

          <label className="field-label">
            Objetivo
            <select
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
            >
              <option>Crear comunidad</option>
              <option>Educar</option>
              <option>Generar visitas</option>
              <option>Presentar un producto</option>
            </select>
          </label>

          <label className="field-label full">
            Tono
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            >
              <option>Cercano y experto</option>
              <option>Directo y enérgico</option>
              <option>Inspirador</option>
              <option>Profesional y claro</option>
            </select>
          </label>
        </div>

        <button
          className="primary ai-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? "Clyvora está creando…"
            : "✦ Generar estrategia y contenido"}
        </button>

        <p className="field-note">
          La IA propone. Tú revisas, editas y decides qué se publica.
        </p>
      </form>

      <article className="ai-result panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">RESULTADO</p>
            <h3>{result ? "Tu propuesta de contenido" : "Listo para crear"}</h3>
          </div>

          {result && <span className="badge">Borrador IA</span>}
        </div>

        {!result && !error && (
          <div className="result-empty">
            <span>✦</span>
            <b>Tu próxima publicación empieza aquí</b>
            <p>
              Completa el brief y Clyvora elaborará una propuesta ajustada a tu
              objetivo y a cada plataforma.
            </p>

            <div className="result-checks">
              <span>✓ Gancho y guion</span>
              <span>✓ Textos por red</span>
              <span>✓ Llamada a la acción</span>
            </div>
          </div>
        )}

        {error && (
          <div className="result-error">
            <b>No se pudo conectar la IA.</b>
            <p>{error}</p>
            <small>
              Revisa que exista <code>app/api/ai/generate/route.ts</code>, que
              exporte <code>POST</code> y que la clave de API esté configurada
              en <code>.env.local</code>.
            </small>
          </div>
        )}

        {result && (
          <>
            <pre className="generated-copy">{result}</pre>

            {historyNotice && <p className="field-note">{historyNotice}</p>}

            <div className="result-actions">
              <button className="outline" type="button" onClick={copyResult}>
                {copied ? "Copiado ✓" : "Copiar texto"}
              </button>

              <button
                className="primary"
                type="button"
                onClick={() => onCreateDraft(result)}
              >
                Guardar en borrador →
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  );
}

function ImageStudio({ onCreateDraft }: Pick<Props, "onCreateDraft">) {
  const [
    prompt,
    setPrompt,
  ] = useState(
    "Una imagen editorial luminosa para una publicación de marca, con composición limpia y espacio visual para texto añadido después."
  );

  const [format, setFormat] = useState("Vertical · Reels / Stories");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setImage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, format }),
      });

      const data = await readApiResponse<{
        image?: string;
        error?: string;
      }>(response, "No fue posible generar la imagen.");

      if (!data.image) {
        throw new Error(data.error || "No fue posible generar la imagen.");
      }

      setImage(data.image);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function downloadImage() {
    const link = document.createElement("a");
    link.href = image;
    link.download = "clyvora-creative.png";
    link.click();
  }

  return (
    <div className="studio-grid image-studio">
      <form className="studio-form panel" onSubmit={generateImage}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">DIRECCIÓN VISUAL</p>
            <h3>Crea una imagen con IA</h3>
          </div>
          <span className="step">02</span>
        </div>

        <label className="field-label">
          Describe la imagen
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            minLength={10}
            maxLength={1800}
            required
            placeholder="Ej.: Producto artesanal sobre una mesa clara, luz cálida, fotografía editorial."
          />
        </label>

        <label className="field-label">
          Formato
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option>Vertical · Reels / Stories</option>
            <option>Cuadrado · Feed</option>
            <option>Horizontal · Facebook</option>
          </select>
        </label>

        <div className="image-tips">
          <b>Consejo</b>
          <p>
            Describe sujeto, ambiente, iluminación, estilo y composición.
            Añade el texto final después: la precisión tipográfica en imágenes
            generadas puede variar.
          </p>
        </div>

        <button
          className="primary ai-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Generando imagen…" : "◉ Generar imagen"}
        </button>

        <p className="field-note">
          La imagen se genera en tu sesión; revísala antes de usarla.
        </p>
      </form>

      <article className="ai-result panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">LIENZO</p>
            <h3>{image ? "Imagen generada" : "Tu imagen aparecerá aquí"}</h3>
          </div>

          {image && <span className="badge">Borrador visual</span>}
        </div>

        {!image && !error && (
          <div className="result-empty">
            <span>◉</span>
            <b>Convierte una idea en una imagen</b>
            <p>
              Genera una pieza original para acompañar tu publicación.
              Después podrás descargarla o guardarla en un borrador.
            </p>
          </div>
        )}

        {error && (
          <div className="result-error">
            <b>No se pudo crear la imagen.</b>
            <p>{error}</p>
            <small>
              Revisa que exista <code>app/api/ai/image/route.ts</code>, que
              exporte <code>POST</code> y que la API devuelva una imagen en
              formato <code>data:image/png;base64,... </code>.
            </small>
          </div>
        )}

        {image && (
          <>
            <img
              className="generated-image"
              src={image}
              alt="Imagen creada por IA a partir de la descripción proporcionada"
            />

            <div className="result-actions">
              <button
                className="outline"
                type="button"
                onClick={downloadImage}
              >
                Descargar PNG
              </button>

              <button
                className="primary"
                type="button"
                onClick={() =>
                  onCreateDraft(`Imagen creada con IA: ${prompt}`)
                }
              >
                Guardar en borrador →
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  );
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number
) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;

    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }

  if (current) lines.push(current);

  return lines;
}

function composeMeme(
  src: string,
  top: string,
  bottom: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Tu navegador no pudo preparar la imagen."));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.round(canvas.width * 0.075);
      const margin = Math.round(canvas.width * 0.04);
      const lineHeight = fontSize * 1.12;

      ctx.font = `900 ${fontSize}px Impact, "Arial Black", Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(4, fontSize / 7);
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";

      const maxWidth = canvas.width - margin * 2;

      const draw = (value: string, fromBottom: boolean) => {
        const lines = wrapLines(ctx, value.toUpperCase(), maxWidth);

        let y = fromBottom
          ? canvas.height - margin - lines.length * lineHeight
          : margin;

        for (const line of lines) {
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
          y += lineHeight;
        }
      };

      if (top) draw(top, false);
      if (bottom) draw(bottom, true);

      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        reject(
          new Error(
            "No se pudo procesar la imagen. Asegúrate de que la API devuelva una imagen base64 o una imagen del mismo dominio."
          )
        );
      }
    };

    img.onerror = () => reject(new Error("No se pudo preparar la imagen."));

    img.src = src;
  });
}

function FullIdeaStudio({
  brief,
  onBriefChange,
  onCreateDraft,
}: Pick<Props, "onCreateDraft"> & {
  brief: string;
  onBriefChange: (value: string) => void;
}) {
  const [platform, setPlatform] = useState("TikTok");
  const [tone, setTone] = useState("Cercano y experto");
  const [format, setFormat] = useState("Vertical · Reels / Stories");
  const [withMemeText, setWithMemeText] = useState(true);

  const [idea, setIdea] = useState<Idea | null>(null);
  const [rawImage, setRawImage] = useState("");
  const [finalImage, setFinalImage] = useState("");

  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!rawImage) {
      setFinalImage("");
      return;
    }

    if (!idea || !withMemeText) {
      setFinalImage(rawImage);
      return;
    }

    let cancelled = false;

    composeMeme(rawImage, idea.memeTop, idea.memeBottom)
      .then((composed) => {
        if (!cancelled) setFinalImage(composed);
      })
      .catch((cause) => {
        if (!cancelled) {
          setFinalImage(rawImage);
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo añadir el texto a la imagen."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rawImage, idea, withMemeText]);

  const fullText = idea
    ? `${idea.caption}\n\n${idea.hashtags
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        .join(" ")}`
    : "";

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIdea(null);
    setRawImage("");
    setFinalImage("");
    setIsLoading(true);

    try {
      setStep("Pensando la idea…");

      const ideaResponse = await fetch("/api/ai/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, platform, tone }),
      });

      const ideaData = await readApiResponse<{
        idea?: Idea;
        error?: string;
      }>(ideaResponse, "No fue posible crear la idea.");

      if (!ideaData.idea) {
        throw new Error(ideaData.error || "No fue posible crear la idea.");
      }

      setIdea(ideaData.idea);

      setStep("Creando la imagen…");

      const imageResponse = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: ideaData.idea.imagePrompt,
          format,
        }),
      });

      const imageData = await readApiResponse<{
        image?: string;
        error?: string;
      }>(imageResponse, "No fue posible generar la imagen.");

      if (!imageData.image) {
        throw new Error(
          imageData.error || "No fue posible generar la imagen."
        );
      }

      setRawImage(imageData.image);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setIsLoading(false);
      setStep("");
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadImage() {
    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "clyvora-meme.png";
    link.click();
  }

  return (
    <div className="studio-grid">
      <form className="studio-form panel" onSubmit={generate}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">IDEA COMPLETA</p>
            <h3>Texto + imagen en un clic</h3>
          </div>
          <span className="step">01</span>
        </div>

        <label className="field-label">
          Cuéntale la idea a Clyvora
          <textarea
            value={brief}
            onChange={(event) => onBriefChange(event.target.value)}
            minLength={10}
            maxLength={1500}
            placeholder="Ej.: Un meme sobre lo difícil que es empezar a hacer ejercicio un lunes."
            required
          />
        </label>

        <div className="field-grid">
          <label className="field-label">
            Canal
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            >
              <option>TikTok</option>
              <option>Instagram</option>
              <option>Facebook</option>
            </select>
          </label>

          <label className="field-label">
            Formato de imagen
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
            >
              <option>Vertical · Reels / Stories</option>
              <option>Cuadrado · Feed</option>
              <option>Horizontal · Facebook</option>
            </select>
          </label>

          <label className="field-label full">
            Tono
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            >
              <option>Cercano y experto</option>
              <option>Directo y enérgico</option>
              <option>Inspirador</option>
              <option>Profesional y claro</option>
            </select>
          </label>

          <label className="field-label full">
            <span>
              <input
                type="checkbox"
                checked={withMemeText}
                onChange={(event) => setWithMemeText(event.target.checked)}
              />
              Añadir texto estilo meme sobre la imagen
            </span>
          </label>
        </div>

        <button
          className="primary ai-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? step || "Clyvora está creando…"
            : "★ Crear idea completa"}
        </button>

        <p className="field-note">
          Cada idea usa un texto y una imagen de tu cuenta de OpenAI. Tú
          revisas y decides qué se publica.
        </p>
      </form>

      <article className="ai-result panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">RESULTADO</p>
            <h3>{idea ? "Tu idea completa" : "Listo para crear"}</h3>
          </div>

          {idea && <span className="badge">Borrador IA</span>}
        </div>

        {!idea && !error && !isLoading && (
          <div className="result-empty">
            <span>★</span>
            <b>Una idea, un texto y una imagen</b>
            <p>
              Describe lo que quieres comunicar y Clyvora crea el texto para
              publicar, los hashtags y una imagen lista para descargar.
            </p>
          </div>
        )}

        {isLoading && !idea && (
          <div className="result-empty">
            <span>✦</span>
            <b>{step}</b>
            <p>Esto puede tardar cerca de un minuto.</p>
          </div>
        )}

        {error && (
          <div className="result-error">
            <b>Algo no salió bien.</b>
            <p>{error}</p>
          </div>
        )}

        {idea && (
          <>
            {finalImage && (
              <img
                className="generated-image"
                src={finalImage}
                alt="Imagen creada por IA para la publicación"
              />
            )}

            {isLoading && !finalImage && (
              <p className="field-note">{step}</p>
            )}

            <pre className="generated-copy">{fullText}</pre>

            <div className="result-actions">
              <button
                className="outline"
                type="button"
                onClick={copyText}
              >
                {copied ? "Copiado ✓" : "Copiar texto"}
              </button>

              {finalImage && (
                <button
                  className="outline"
                  type="button"
                  onClick={downloadImage}
                >
                  Descargar imagen
                </button>
              )}

              <button
                className="primary"
                type="button"
                onClick={() => onCreateDraft(fullText)}
              >
                Guardar en borrador →
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  );
}
