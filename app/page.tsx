"use client";

import { useState } from "react";
import { AiStudio } from "./components/ai-studio";
import { AutomationHub } from "./components/automation-hub";
import { WorkspaceModule } from "./components/workspace-module";

type Network = "TikTok" | "Instagram" | "Facebook";

const networks: { name: Network; handle: string; color: string; status: string }[] = [
  { name: "TikTok", handle: "@tu-cuenta", color: "#e9fcfb", status: "Por conectar" },
  { name: "Instagram", handle: "@tu-cuenta", color: "#fdeaf5", status: "Por conectar" },
  { name: "Facebook", handle: "Tu página", color: "#e8efff", status: "Por conectar" },
];

const ideas = [
  ["Historia breve", "El problema que resolviste antes de crear tu producto", "Reel · 30–45 s"],
  ["Guía útil", "Tres errores que tu audiencia puede evitar hoy", "Carrusel · 5 láminas"],
  ["Prueba social", "Un resultado real contado por quien lo vivió", "Video · 20–30 s"],
];

export default function Home() {
  const [connectionTarget, setConnectionTarget] = useState<Network | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [activeTab, setActiveTab] = useState("Inicio");
  const [draftText, setDraftText] = useState("");
  const total = 0;

  function openDraft(content = "") {
    setDraftText(content);
    setComposerOpen(true);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">C</span><span>Clyvora</span></a>
        <p className="workspace">ESPACIO DE TRABAJO</p>
        <nav>
          {["Inicio", "Estudio IA", "Calendario", "Biblioteca", "Automatizaciones", "Comunidad", "Analítica", "Ajustes"].map((item) => (
            <button key={item} className={activeTab === item ? "nav-item active" : "nav-item"} onClick={() => setActiveTab(item)}>
              <span>{item === "Inicio" ? "⌂" : item === "Estudio IA" ? "✦" : item === "Calendario" ? "□" : item === "Biblioteca" ? "▣" : item === "Automatizaciones" ? "↻" : item === "Comunidad" ? "◌" : item === "Analítica" ? "↗" : "⚙"}</span>{item}
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><b>Inteligencia para crecer.</b><br />La audiencia se gana con contenido útil, consistencia y conversación.</div>
        <button className="profile"><span className="avatar">T</span><span><b>Tu marca</b><small>Plan inicial</small></span><span>⌄</span></button>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <div><p className="eyebrow">{activeTab === "Inicio" ? "PANEL PRINCIPAL" : "MÓDULO"}</p><h1>{activeTab}</h1></div>
          <div className="header-actions"><button className="icon-button" aria-label="Notificaciones">⌁</button><button className="primary" onClick={() => setActiveTab("Estudio IA")}>✦ Crear con IA</button></div>
        </header>

        {activeTab === "Estudio IA" ? <AiStudio initialBrief={draftText} onCreateDraft={openDraft} /> : activeTab === "Automatizaciones" ? <AutomationHub /> : activeTab !== "Inicio" ? <WorkspaceModule module={activeTab as "Calendario" | "Biblioteca" | "Comunidad" | "Analítica" | "Ajustes"} onNavigate={setActiveTab} /> : <>
        <section className="hero">
          <div><p className="eyebrow">SOCIAL INTELLIGENCE PLATFORM</p><h2>Convierte buenas ideas en una comunidad real.</h2><p>Diseña, adapta y mide tu contenido en un solo lugar. Tú conservas el control de cada publicación.</p><button className="primary light" onClick={() => setActiveTab("Estudio IA")}>Abrir el estudio IA <span>→</span></button></div>
          <div className="hero-orbit"><div className="orbit-core">✦<small>tu voz</small></div><i className="bubble b1">◎</i><i className="bubble b2">▶</i><i className="bubble b3">♥</i></div>
        </section>

        <section className="metrics" aria-label="Resumen de rendimiento">
          <article><span className="metric-icon purple">◒</span><div><p>CUENTAS CONECTADAS</p><strong>{total} <small>/ 3</small></strong><em>Sin autorización todavía</em></div></article>
          <article><span className="metric-icon orange">↗</span><div><p>ALCANCE ESTA SEMANA</p><strong>—</strong><em>Se verá tras una conexión real</em></div></article>
          <article><span className="metric-icon pink">♡</span><div><p>INTERACCIONES</p><strong>—</strong><em>Se verá tras una conexión real</em></div></article>
        </section>

        <section className="grid">
          <article className="panel connections"><div className="panel-heading"><div><p className="eyebrow">PRIMER PASO</p><h3>Conecta tus perfiles</h3></div><span className="badge">Seguro y oficial</span></div><p className="subcopy">Las conexiones usan la autorización oficial de cada plataforma. Nunca pedimos tu contraseña.</p>
            <div className="network-list">{networks.map((network) => <div className="network" key={network.name}><span className="network-logo" style={{ background: network.color }}>{network.name === "TikTok" ? "♪" : network.name === "Instagram" ? "◉" : "f"}</span><span><b>{network.name}</b><small>{network.handle} · Sin conectar</small></span><button className="outline" onClick={() => setConnectionTarget(network.name)}>Configurar</button></div>)}</div>
          </article>

          <article className="panel calendar"><div className="panel-heading"><div><p className="eyebrow">PRÓXIMAMENTE</p><h3>Tu ritmo de publicación</h3></div><button className="text-button">Ver calendario →</button></div><div className="calendar-days">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => <div key={day} className={i === 2 ? "day selected" : "day"}><span>{day}</span><b>{13 + i}</b>{i === 2 && <i />}</div>)}</div><div className="empty-calendar"><span>✦</span><b>Aún no hay contenido programado</b><p>Empieza con una idea; Clyvora te ayudará a convertirla en piezas para cada red.</p></div></article>
        </section>

        <section className="panel ideas"><div className="panel-heading"><div><p className="eyebrow">ASISTENTE CREATIVO</p><h3>Ideas para empezar</h3></div><button className="text-button" onClick={() => { setDraftText(""); setActiveTab("Estudio IA"); }}>Generar más →</button></div><div className="idea-list">{ideas.map(([kind, title, format]) => <button key={kind} className="idea" onClick={() => { setDraftText(title); setActiveTab("Estudio IA"); }}><span className="spark">✦</span><span><small>{kind}</small><b>{title}</b><em>{format}</em></span><strong>→</strong></button>)}</div></section>
        </>}
      </section>

      {connectionTarget && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Configurar ${connectionTarget}`}><section className="modal connection-modal"><button className="close" onClick={() => setConnectionTarget(null)}>×</button><p className="eyebrow">CONEXIÓN OFICIAL REQUERIDA</p><h2>{connectionTarget} aún no está conectada</h2><p className="connection-copy">Para mostrar “Conectada”, Clyvora debe abrir la autorización OAuth oficial de {connectionTarget}. Aún faltan las credenciales de desarrollador y la URL pública de retorno; por eso este botón no fingirá una conexión.</p><div className="connection-list"><span>1. Registrar la aplicación de Clyvora</span><span>2. Configurar ID, secreto y URL de retorno</span><span>3. Autorizar tu cuenta en {connectionTarget}</span></div><button className="primary wide" onClick={() => { setConnectionTarget(null); setActiveTab("Automatizaciones"); }}>Ver estado de integraciones →</button></section></div>}
      {composerOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Crear contenido"><section className="modal"><button className="close" onClick={() => setComposerOpen(false)}>×</button>{published ? <div className="success"><span>✓</span><h2>Borrador guardado en esta sesión</h2><p>Cuando exista una cuenta autorizada, podrás enviarlo a revisión y luego programar su publicación.</p><button className="primary" onClick={() => { setPublished(false); setComposerOpen(false); }}>Listo</button></div> : <><p className="eyebrow">BORRADOR</p><h2>Revisa tu contenido</h2><label>Texto o idea principal<textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} placeholder="Crea el texto en el Estudio IA o escribe aquí tu idea." autoFocus /></label><div className="modal-row"><label>Formato<select defaultValue="Reel / video corto"><option>Reel / video corto</option><option>Carrusel</option><option>Publicación con imagen</option></select></label><label>Estado<select defaultValue="Pendiente de revisión"><option>Pendiente de revisión</option><option>Listo para programar</option></select></label></div><p className="hint">Guardar un borrador no publica nada. Una publicación real solo será posible tras conectar una cuenta mediante OAuth.</p><button className="primary wide" onClick={() => setPublished(true)}>Guardar borrador →</button></>}</section></div>}
    </main>
  );
}
