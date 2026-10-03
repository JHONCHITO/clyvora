"use client";

type Module = "Calendario" | "Biblioteca" | "Comunidad" | "Analítica" | "Ajustes";

type Props = { module: Module; onNavigate: (target: string) => void };

const copy: Record<Module, { eyebrow: string; title: string; description: string; action: string; target: string; icon: string }> = {
  Calendario: { eyebrow: "PLANIFICACIÓN", title: "Tu calendario editorial", description: "Aún no hay publicaciones programadas. Crea una pieza con IA, revísala y solo entonces podrás elegir una fecha cuando una cuenta esté autorizada.", action: "Crear contenido", target: "Estudio IA", icon: "□" },
  Biblioteca: { eyebrow: "ACTIVOS CREATIVOS", title: "Biblioteca de contenido", description: "Aquí se guardarán tus textos, imágenes generadas y versiones aprobadas. Todavía no hay activos permanentes porque la base de datos se añadirá en la siguiente fase.", action: "Crear imagen con IA", target: "Estudio IA", icon: "▣" },
  Comunidad: { eyebrow: "CONVERSACIONES", title: "Gestiona tu comunidad", description: "Los comentarios y mensajes aparecerán cuando conectes tus perfiles mediante las APIs oficiales. Clyvora podrá proponer respuestas, pero nunca enviará una sin tu aprobación.", action: "Ver integraciones", target: "Automatizaciones", icon: "◌" },
  Analítica: { eyebrow: "APRENDIZAJE", title: "Métricas que mejoran tu contenido", description: "No existen métricas hasta que una cuenta se conecte realmente. Cuando ocurra, esta sección analizará alcance, retención, guardados e interacción para orientar tus siguientes ideas.", action: "Crear una estrategia", target: "Estudio IA", icon: "↗" },
  Ajustes: { eyebrow: "PERFIL DE MARCA", title: "Entrena a tu copiloto", description: "Define tu voz, audiencia y propuesta de valor. Este perfil será el contexto que use la IA al crear contenido, para que las propuestas se parezcan a tu marca.", action: "Abrir Estudio IA", target: "Estudio IA", icon: "⚙" },
};

export function WorkspaceModule({ module, onNavigate }: Props) {
  const item = copy[module];
  return <section className="module-page"><div className="module-hero panel"><span className="module-icon">{item.icon}</span><p className="eyebrow">{item.eyebrow}</p><h2>{item.title}</h2><p>{item.description}</p><button className="primary" onClick={() => onNavigate(item.target)}>{item.action} →</button></div><div className="module-grid"><article className="panel module-empty"><span>{item.icon}</span><b>Sin datos todavía</b><p>Mostramos el estado real del producto: esta sección se activará con datos autorizados o contenido que tú guardes.</p></article><article className="panel module-next"><p className="eyebrow">PRÓXIMO PASO</p><h3>{module === "Ajustes" ? "Define tu identidad de marca" : module === "Calendario" ? "Crea un borrador con IA" : "Conecta fuentes reales"}</h3><ol><li>Completa la configuración que corresponda.</li><li>Revisa el resultado antes de aprobarlo.</li><li>Usa datos reales para decidir el siguiente paso.</li></ol></article></div></section>;
}
