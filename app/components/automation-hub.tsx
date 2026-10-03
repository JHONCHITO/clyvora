"use client";

import { useState } from "react";

const rules = [
  { name: "Revisión antes de publicar", description: "Todo contenido de IA pasa a tu aprobación antes de enviarse a una red.", enabled: true, type: "Protección" },
  { name: "Análisis post-publicación", description: "48 horas después, compara alcance, retención e interacción con tus publicaciones anteriores.", enabled: true, type: "Aprendizaje" },
  { name: "Recomendaciones semanales", description: "Cada lunes, Clyvora prepara prioridades de contenido basadas en tus métricas reales.", enabled: false, type: "Estrategia" },
];

export function AutomationHub() {
  const [enabled, setEnabled] = useState(rules.map((rule) => rule.enabled));
  return <section className="automation-page">
    <div className="studio-intro"><div><p className="eyebrow">OPERACIÓN INTELIGENTE</p><h2>Automatiza el proceso, no la autenticidad.</h2><p>Reduce tareas repetitivas, conserva siempre tu aprobación y deja que las métricas mejoren el siguiente contenido.</p></div><button className="primary">＋ Nueva automatización</button></div>
    <div className="automation-summary"><article><span>◌</span><b>0</b><small>cuentas autorizadas</small></article><article><span>↻</span><b>{enabled.filter(Boolean).length}</b><small>flujos activos</small></article><article><span>✓</span><b>100%</b><small>control de aprobación</small></article></div>
    <section className="automation-rules panel"><div className="panel-heading"><div><p className="eyebrow">FLUJOS PREPARADOS</p><h3>Automatizaciones seguras</h3></div><span className="badge">Sin acciones masivas</span></div>{rules.map((rule, index) => <div className="rule" key={rule.name}><span className="rule-icon">{index === 0 ? "✓" : index === 1 ? "↗" : "✦"}</span><div><b>{rule.name}</b><p>{rule.description}</p><small>{rule.type}</small></div><button className={enabled[index] ? "switch on" : "switch"} aria-label={`Activar ${rule.name}`} onClick={() => setEnabled(enabled.map((value, item) => item === index ? !value : value))}><i /></button></div>)}</section>
    <section className="panel connector-roadmap"><p className="eyebrow">SIGUIENTE HITO</p><h3>Conectar perfiles con autorización oficial</h3><p>Cuando registremos las apps de Meta y TikTok, aquí aparecerá el asistente OAuth, los permisos solicitados y el estado de cada conexión. No se usan contraseñas ni automatizaciones de seguidores.</p><div><span>Meta APIs</span><i>→</i><span>TikTok Content Posting API</span><i>→</i><span>Publicación aprobada</span></div></section>
  </section>;
}
