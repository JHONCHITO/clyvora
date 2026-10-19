import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
export const SESSION_COOKIE = 'clyvora_owner_session';
export const SESSION_SECONDS = 8 * 60 * 60;
const OWNER = 'clyvora-owner';

function sessionSecret() {
  const value = process.env.CLYVORA_SESSION_SECRET;
  if (!value || !/^[a-f0-9]{64,128}$/i.test(value)) throw new Error('Owner authentication not configured');
  return value;
}

export function authConfigured() {
  return /^[a-f0-9]{64,128}$/i.test(process.env.CLYVORA_SESSION_SECRET || '') && /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(process.env.CLYVORA_OWNER_PASSWORD_HASH || '');
}

export async function verifyOwnerPassword(password: string) {
  if (!authConfigured() || password.length < 1 || password.length > 512) return false;
  const [salt, encoded] = process.env.CLYVORA_OWNER_PASSWORD_HASH!.split(':');
  const actual = await deriveKey(password, salt, 64) as Buffer;
  const expected = Buffer.from(encoded, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function issueOwnerSession() {
  if (!authConfigured()) throw new Error('Owner authentication not configured');
  const issued = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ owner: OWNER, issued, expires: issued + SESSION_SECONDS, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function ownerFromSession(value: string | undefined): string | null {
  if (!authConfigured() || !value || value.length > 1024) return null;
  try {
    const parts = value.split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expected = createHmac('sha256', sessionSecret()).update(body).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (data.owner !== OWNER || !Number.isSafeInteger(data.issued) || !Number.isSafeInteger(data.expires) || data.issued > now + 60 || data.expires <= now || data.expires - data.issued !== SESSION_SECONDS || !/^[a-f0-9]{32}$/.test(data.nonce)) return null;
    return OWNER;
  } catch { return null; }
}

export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}

export async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Invalid body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) { await reader.cancel(); throw new Error('Body too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
