import crypto from 'node:crypto';
import { env } from '../config/env';

/**
 * AES-256-GCM sobre campos sensibles (amounts, descriptions, rates).
 * Formato del ciphertext: "iv:tag:cipher" (todo base64).
 *
 * Cada llamada a encrypt() genera un IV nuevo, así que el mismo plaintext
 * produce ciphertexts distintos (no-determinístico). Esto rompe las
 * aggregations de Mongo — las hacemos en memoria a nivel service.
 *
 * Si la key se pierde, la data encriptada es irrecuperable.
 */

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');
if (KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY debe tener 32 bytes (64 hex chars)');
}

/** Detecta si un valor parece ya encriptado (tres partes base64 separadas por :). */
function looksEncrypted(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    v.length > 20 &&
    v.split(':').length === 3
  );
}

export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(12); // GCM recomienda 12 bytes
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/**
 * Desencripta un ciphertext. Si el valor no parece encriptado (data vieja
 * pre-encryption), lo devuelve tal cual como string para retro-compat.
 */
export function decryptField(value: unknown): string {
  if (value == null) return '';
  if (!looksEncrypted(value)) return String(value);
  try {
    const [ivB64, tagB64, ctB64] = value.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    // Falla de tag/formato → devolver algo para no crashear.
    return String(value);
  }
}

// Helpers para números
export function encryptNumber(n: number): string {
  return encryptField(String(n));
}
export function decryptNumber(v: unknown): number {
  if (v == null) return 0;
  const s = decryptField(v);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Helpers para números opcionales (null-safe)
export function encryptOptNumber(n: number | null | undefined): string | null {
  return n == null ? null : encryptField(String(n));
}
export function decryptOptNumber(v: unknown): number | null {
  if (v == null) return null;
  const s = decryptField(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
