"use client";

import { FormEvent, useEffect, useState } from "react";

const briefExamples = [
  "Explica cómo mi servicio resuelve un problema cotidiano en menos de un minuto.",
  "Cuenta la historia real de por qué nació mi marca, con un tono cercano.",
  "Crea una mini guía con tres consejos prácticos para mi audiencia.",
];

type Props = { onCreateDraft: (content: string) => void; initialBrief?: string };

export function AiStudio({ onCreateDraft, initialBrief }: Props) {
  const [brief, setBrief] = useState(initialBrief || briefExamples[0]);
  const [creativeMode, setCreativeMode] = useState<"copy" | "image">("copy");
  const [platform, setPlatform] = useState("Multiplataforma");
  const [objective, setObjective] = useState("Crear comunidad");
  const [tone, setTone] = useState("Cercano y experto");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialBrief) {
      setBrief(initialBrief);
      setCreativeMode("copy");
    }
  }, [initialBrief]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, platform, objective, tone }),
      });
      const data = (await response.json()) as { content?: string; error?: string };
      if (!response.ok || !data.content) throw new Error(data.error || "No fue posible generar el contenido.");
      setResult(data.content);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocurrió un error inesperado.");
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
    <section className="studio-layout">
      <div className="studio-intro">
        <div><p className="eyebrow">COPILOTO CREATIVO</p><h2>Tu estudio de contenido con IA</h2><p>Convierte una idea en un guion, textos nativos para cada plataforma y una publicación lista para revisar.</p></div>
        <span className="ai-status"><i /> IA preparada</span>
      </div>

      <div className="studio-tabs" role="tablist"><button className={creativeMode === "copy" ? "tab active" : "tab"} onClick={() => setCreativeMode("copy")}>✦ Crear contenido</button><button className={creativeMode === "image" ? "tab active" : "tab"} onClick={() => setCreativeMode("image")}>◉ Crear imagen</button></div>

      {creativeMode === "copy" ? <><div className="studio-grid">
        <form className="studio-form panel" onSubmit={generate}>
          <div className="panel-heading"><div><p className="eyebrow">BRIEF CREATIVO</p><h3>¿Qué quieres comunicar?</h3></div><span className="step">01</span></div>
          <label className="field-label">Cuéntale la idea a Clyvora<textarea value={brief} onChange={(event) => setBrief(event.target.value)} minLength={10} maxLength={1500} placeholder="Describe el tema, producto, experiencia o mensaje que quieres compartir." required /></label>
          <div className="quick-ideas"><span>Prueba una idea:</span>{briefExamples.map((example) => <button type="button" key={example} onClick={() => setBrief(example)}>✦ {example.slice(0, 29)}…</button>)}</div>
          <div className="field-grid">
            <label className="field-label">Canal<select value={platform} onChange={(event) => setPlatform(event.target.value)}><option>Multiplataforma</option><option>TikTok</option><option>Instagram</option><option>Facebook</option></select></label>
            <label className="field-label">Objetivo<select value={objective} onChange={(event) => setObjective(event.target.value)}><option>Crear comunidad</option><option>Educar</option><option>Generar visitas</option><option>Presentar un producto</option></select></label>
            <label className="field-label full">Tono<select value={tone} onChange={(event) => setTone(event.target.value)}><option>Cercano y experto</option><option>Directo y enérgico</option><option>Inspirador</option><option>Profesional y claro</option></select></label>
          </div>
          <button className="primary ai-button" type="submit" disabled={isLoading}>{isLoading ? "Clyvora está creando…" : "✦ Generar estrategia y contenido"}</button>
          <p className="field-note">La IA propone. Tú revisas, editas y decides qué se publica.</p>
        </form>

        <article className="ai-result panel">
          <div className="panel-heading"><div><p className="eyebrow">RESULTADO</p><h3>{result ? "Tu propuesta de contenido" : "Listo para crear"}</h3></div>{result && <span className="badge">Borrador IA</span>}</div>
          {!result && !error && <div className="result-empty"><span>✦</span><b>Tu próxima publicación empieza aquí</b><p>Completa el brief y Clyvora elaborará una propuesta ajustada a tu objetivo y a cada plataforma.</p><div className="result-checks"><span>✓ Gancho y guion</span><span>✓ Textos por red</span><span>✓ Llamada a la acción</span></div></div>}
          {error && <div className="result-error"><b>No se pudo conectar la IA.</b><p>{error}</p><small>Agrega una clave de API en el archivo <code>.env.local</code> y vuelve a intentarlo.</small></div>}
          {result && <><pre className="generated-copy">{result}</pre><div className="result-actions"><button className="outline" onClick={copyResult}>{copied ? "Copiado ✓" : "Copiar texto"}</button><button className="primary" onClick={() => onCreateDraft(result)}>Guardar en borrador →</button></div></>}
        </article>
      </div>

      <section className="workflow panel">
        <div className="panel-heading"><div><p className="eyebrow">SISTEMA DE CRECIMIENTO</p><h3>De una idea a una comunidad</h3></div><span className="badge">Control humano</span></div>
        <div className="workflow-steps"><div><span>01</span><b>Investiga</b><p>Registra tus temas, audiencia y objetivos.</p></div><i>→</i><div><span>02</span><b>La IA propone</b><p>Crea guiones, copys y variantes nativas.</p></div><i>→</i><div><span>03</span><b>Tú apruebas</b><p>Edita cada pieza antes de programarla.</p></div><i>→</i><div><span>04</span><b>Aprende</b><p>Convierte resultados en mejores decisiones.</p></div></div>
      </section>
      </> : <ImageStudio onCreateDraft={onCreateDraft} />}
    </section>
  );
}

function ImageStudio({ onCreateDraft }: Pick<Props, "onCreateDraft">) {
  const [prompt, setPrompt] = useState("Una imagen editorial luminosa para una publicación de marca, con composición limpia y espacio visual para texto añadido después.");
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
      const response = await fetch("/api/ai/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, format }) });
      const data = (await response.json()) as { image?: string; error?: string };
      if (!response.ok || !data.image) throw new Error(data.error || "No fue posible generar la imagen.");
      setImage(data.image);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocurrió un error inesperado.");
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

  return <div className="studio-grid image-studio">
    <form className="studio-form panel" onSubmit={generateImage}><div className="panel-heading"><div><p className="eyebrow">DIRECCIÓN VISUAL</p><h3>Crea una imagen con IA</h3></div><span className="step">02</span></div><label className="field-label">Describe la imagen<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} minLength={10} maxLength={1800} required placeholder="Ej.: Producto artesanal sobre una mesa clara, luz cálida, fotografía editorial." /></label><label className="field-label">Formato<select value={format} onChange={(event) => setFormat(event.target.value)}><option>Vertical · Reels / Stories</option><option>Cuadrado · Feed</option><option>Horizontal · Facebook</option></select></label><div className="image-tips"><b>Consejo</b><p>Describe sujeto, ambiente, iluminación, estilo y composición. Añade el texto final después: la precisión tipográfica en imágenes generadas puede variar.</p></div><button className="primary ai-button" type="submit" disabled={isLoading}>{isLoading ? "Generando imagen…" : "◉ Generar imagen"}</button><p className="field-note">La imagen se genera en tu sesión; revísala antes de usarla.</p></form>
    <article className="ai-result panel"><div className="panel-heading"><div><p className="eyebrow">LIENZO</p><h3>{image ? "Imagen generada" : "Tu imagen aparecerá aquí"}</h3></div>{image && <span className="badge">Borrador visual</span>}</div>{!image && !error && <div className="result-empty"><span>◉</span><b>Convierte una idea en una imagen</b><p>Genera una pieza original para acompañar tu publicación. Después podrás descargarla o guardarla en un borrador.</p></div>}{error && <div className="result-error"><b>No se pudo crear la imagen.</b><p>{error}</p><small>Revisa la clave de API, los permisos de organización y vuelve a intentarlo.</small></div>}{image && <><img className="generated-image" src={image} alt="Imagen creada por IA a partir de la descripción proporcionada" /><div className="result-actions"><button className="outline" onClick={downloadImage}>Descargar PNG</button><button className="primary" onClick={() => onCreateDraft(`Imagen creada con IA: ${prompt}`)}>Guardar en borrador →</button></div></>}</article>
  </div>;
}
