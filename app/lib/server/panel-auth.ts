
import { createHmac, timingSafeEqual } from "node:crypto";

export const PANEL_COOKIE = "clyvora_panel_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function sessionSecret(): string {
  const secret = process.env.CLYVORA_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("CLYVORA_SESSION_SECRET no está configurada correctamente.");
  }

  return secret;
}

function sign(timestamp: string): string {
  return createHmac("sha256", sessionSecret())
    .update(timestamp)
    .digest("base64url");
}

export function createPanelSession(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return `${timestamp}.${sign(timestamp)}`;
}

export function isValidPanelSession(value?: string): boolean {
  if (!value) return false;

  try {
    const [timestamp, signature, extra] = value.split(".");
    if (!timestamp || !signature || extra !== undefined) return false;
    if (!/^\d+$/.test(timestamp)) return false;

    const issuedAt = Number(timestamp);
    const now = Math.floor(Date.now() / 1000);

    if (issuedAt > now + 60 || now - issuedAt >= SESSION_MAX_AGE) {
      return false;
    }

    const expected = Buffer.from(sign(timestamp));
    const received = Buffer.from(signature);

    return (
      expected.length === received.length &&
      timingSafeEqual(expected, received)
    );
  } catch {
    return false;
  }
}
