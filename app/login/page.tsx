'use client';

import { useState, type FormEvent } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json();
      setPassword('');
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
      window.location.assign('/');
    } catch (cause) {
      setPassword('');
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    } finally { setBusy(false); }
  }

  return <main style={{ maxWidth: 480, margin: '10vh auto', padding: 24 }}><section className="panel"><p className="eyebrow">CLYVORA · ACCESO PRIVADO</p><h1>Tu centro de contenido</h1><p>Inicia sesión como propietario. Este primer acceso es para un único espacio de trabajo.</p><form onSubmit={login}><label className="field-label">Contraseña del propietario<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={512} /></label>{error && <p role="alert">{error}</p>}<button className="primary" disabled={busy} type="submit">{busy ? 'Verificando…' : 'Entrar a Clyvora'}</button></form><p>No introduzcas claves de OpenAI ni contraseñas de tus redes sociales.</p></section></main>;
}
