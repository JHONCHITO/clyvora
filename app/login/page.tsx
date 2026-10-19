
"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo iniciar sesión.");
        return;
      }

      window.location.replace("/");
    } catch {
      setError("No se pudo conectar con Clyvora. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f5f4fb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
          padding: 32,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 18px 60px rgba(30, 20, 70, 0.12)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            display: "grid",
            placeItems: "center",
            borderRadius: 16,
            background: "#7155e8",
            color: "#fff",
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          C
        </div>

        <p
          style={{
            color: "#7155e8",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 2,
          }}
        >
          ESPACIO PRIVADO
        </p>

        <h1 style={{ color: "#211b36", marginBottom: 8 }}>
          Bienvenido a Clyvora
        </h1>

        <p style={{ color: "#716b80", lineHeight: 1.6 }}>
          Introduce tu contraseña para acceder a tu espacio de trabajo.
        </p>

        <form onSubmit={submit}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginTop: 24,
              marginBottom: 8,
              fontWeight: 600,
              color: "#302943",
            }}
          >
            Contraseña privada
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            maxLength={512}
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              border: "1px solid #ded9ec",
              borderRadius: 12,
              fontSize: 16,
              outlineColor: "#7155e8",
            }}
          />

          {error && (
            <p role="alert" style={{ color: "#b42318", lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              marginTop: 20,
              padding: 15,
              border: 0,
              borderRadius: 12,
              background: "#7155e8",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              opacity: loading || !password ? 0.7 : 1,
            }}
          >
            {loading ? "Verificando…" : "Entrar a Clyvora →"}
          </button>
        </form>

        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            textAlign: "center",
            color: "#827b91",
          }}
        >
          Acceso privado · Clyvora
        </p>
      </section>
    </main>
  );
}
