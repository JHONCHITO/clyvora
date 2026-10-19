
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createPanelSession,
  PANEL_COOKIE,
  SESSION_MAX_AGE,
} from "../../../lib/server/panel-auth";

export const runtime = "nodejs";

function matchesPassword(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expected = process.env.CLYVORA_PANEL_PASSWORD;

  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { error: "El acceso privado no está configurado correctamente." },
      { status: 503 }
    );
  }

  let body: { password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud no válida." },
      { status: 400 }
    );
  }

  if (
    typeof body.password !== "string" ||
    body.password.length > 512 ||
    !matchesPassword(body.password, expected)
  ) {
    return NextResponse.json(
      { error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }

  try {
    const response = NextResponse.json({ ok: true });

    response.cookies.set(PANEL_COOKIE, createPanelSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar la sesión. Revisa la configuración." },
      { status: 503 }
    );
  }
}
