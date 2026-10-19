
"use client";

import { useEffect, useState } from "react";

type Module =
  | "Calendario"
  | "Biblioteca"
  | "Comunidad"
  | "Analítica"
  | "Ajustes";

type Props = {
  module: Module;
  onNavigate: (target: string) => void;
};

type Draft = {
  id: string;
  content: string;
  format: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const copy: Record<
  Module,
  {
    eyebrow: string;
    title: string;
    description: string;
    action: string;
    target: string;
    icon: string;
  }
> = {
  Calendario: {
    eyebrow: "PLANIFICACIÓN",
    title: "Tu calendario editorial",
    description:
      "Organiza tus borradores y prepara el contenido que quieres publicar.",
    action: "Crear contenido",
    target: "Estudio IA",
    icon: "□",
  },
  Biblioteca: {
    eyebrow: "ACTIVOS CREATIVOS",
    title: "Biblioteca de contenido",
    description:
      "Consulta los textos que has guardado permanentemente en Clyvora.",
    action: "Crear contenido",
    target: "Estudio IA",
    icon: "▣",
  },
  Comunidad: {
    eyebrow: "CONVERSACIONES",
    title: "Gestiona tu comunidad",
    description:
      "Los comentarios y mensajes aparecerán cuando conectes tus perfiles mediante las APIs oficiales.",
    action: "Ver integraciones",
    target: "Automatizaciones",
    icon: "◌",
  },
  Analítica: {
    eyebrow: "APRENDIZAJE",
    title: "Métricas que mejoran tu contenido",
    description:
      "Las métricas reales estarán disponibles cuando las plataformas autoricen el acceso a sus datos.",
    action: "Crear una estrategia",
    target: "Estudio IA",
    icon: "↗",
  },
  Ajustes: {
    eyebrow: "PERFIL DE MARCA",
    title: "Entrena a tu copiloto",
    description:
      "Define tu voz, audiencia y propuesta de valor para orientar las ideas de la IA.",
    action: "Abrir Estudio IA",
    target: "Estudio IA",
    icon: "⚙",
  },
};

export function WorkspaceModule({ module, onNavigate }: Props) {
  const item = copy[module];

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftError, setDraftError] = useState("");

  useEffect(() => {
    if (module !== "Biblioteca") return;

    let cancelled = false;

    async function loadDrafts() {
      setLoadingDrafts(true);
      setDraftError("");

      try {
        const response = await fetch("/api/drafts", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "No se pudieron cargar los borradores."
          );
        }

        if (!cancelled) {
          setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
        }
      } catch (error) {
        if (!cancelled) {
          setDraftError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los borradores."
          );
        }
      } finally {
        if (!cancelled) setLoadingDrafts(false);
      }
    }

    void loadDrafts();

    return () => {
      cancelled = true;
    };
  }, [module]);

  return (
    <section className="module-page">
      <div className="module-hero panel">
        <span className="module-icon">{item.icon}</span>
        <p className="eyebrow">{item.eyebrow}</p>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <button
          className="primary"
          onClick={() => onNavigate(item.target)}
        >
          {item.action} →
        </button>
      </div>

      {module === "Biblioteca" ? (
        <div className="module-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CONTENIDO PERMANENTE</p>
                <h3>Tus borradores</h3>
              </div>
              <button
                className="text-button"
                onClick={() => onNavigate("Estudio IA")}
              >
                Crear nuevo →
              </button>
            </div>

            {loadingDrafts && <p>Cargando borradores...</p>}

            {draftError && (
              <div className="result-error">
                <b>No se pudo cargar la Biblioteca.</b>
                <p>{draftError}</p>
                <button
                  className="outline"
                  onClick={() => {
                    setDrafts([]);
                    setDraftError("");
                    setLoadingDrafts(true);
                    fetch("/api/drafts", { cache: "no-store" })
                      .then(async (response) => {
                        const data = await response.json();
                        if (!response.ok) {
                          throw new Error(
                            data.error || "Error al cargar los borradores."
                          );
                        }
                        setDrafts(data.drafts || []);
                      })
                      .catch((error) =>
                        setDraftError(
                          error instanceof Error
                            ? error.message
                            : "Error al cargar los borradores."
                        )
                      )
                      .finally(() => setLoadingDrafts(false));
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loadingDrafts && !draftError && drafts.length === 0 && (
              <div className="module-empty">
                <span>▣</span>
                <b>Aún no hay borradores guardados</b>
                <p>
                  Crea contenido en Estudio IA y utiliza el botón Guardar
                  borrador para conservarlo aquí.
                </p>
              </div>
            )}

            {drafts.map((draft) => (
              <article
                className="panel"
                key={draft.id}
                style={{ marginTop: 14 }}
              >
                <p className="eyebrow">
                  {draft.format} · {draft.status}
                </p>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {draft.content}
                </p>
                <p className="field-note">
                  Guardado:{" "}
                  {new Date(draft.createdAt).toLocaleString("es-CO")}
                </p>
              </article>
            ))}
          </article>

          <article className="panel module-next">
            <p className="eyebrow">FLUJO DE TRABAJO</p>
            <h3>De la idea a la publicación</h3>
            <ol>
              <li>Genera una propuesta con IA.</li>
              <li>Guárdala y revísala en tu Biblioteca.</li>
              <li>Autoriza y verifica la plataforma antes de publicar.</li>
            </ol>
          </article>
        </div>
      ) : (
        <div className="module-grid">
          <article className="panel module-empty">
            <span>{item.icon}</span>
            <b>Sin datos todavía</b>
            <p>
              Esta sección se activará cuando haya datos reales o contenido
              autorizado.
            </p>
          </article>

          <article className="panel module-next">
            <p className="eyebrow">PRÓXIMO PASO</p>
            <h3>
              {module === "Ajustes"
                ? "Define tu identidad de marca"
                : module === "Calendario"
                  ? "Crea un borrador con IA"
                  : "Conecta fuentes reales"}
            </h3>
            <ol>
              <li>Completa la configuración que corresponda.</li>
              <li>Revisa el resultado antes de aprobarlo.</li>
              <li>Usa datos reales para decidir el siguiente paso.</li>
            </ol>
          </article>
        </div>
      )}
    </section>
  );
}
