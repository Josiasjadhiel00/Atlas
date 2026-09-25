import crypto from "crypto";

// =========================================================================
// AUTENTICACIÓN COMPARTIDA — usada tanto por las rutas HTTP (server.ts)
// como por el handshake del WebSocket (api/websocketServer.ts), para que
// ambos acepten exactamente la misma sesión.
// =========================================================================

export const SESSION_SECRET = process.env.ATLAS_SESSION_SECRET?.trim() || crypto.randomBytes(32).toString("hex");
export const ACCESS_PASSWORD = process.env.ATLAS_ACCESS_PASSWORD?.trim() || "";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días
export const SESSION_COOKIE = "atlas_session";

if (!process.env.ATLAS_SESSION_SECRET) {
  console.warn("[AUTH] ATLAS_SESSION_SECRET no está fijada en .env: se generó una temporal, así que las sesiones no sobrevivirán un reinicio del servidor. Fija una fija en tu .env para producción.");
}
if (!ACCESS_PASSWORD) {
  console.warn("[AUTH] ⚠️  ATLAS_ACCESS_PASSWORD no está configurada. Mientras esté vacía, NADIE puede iniciar sesión y /api/* seguirá bloqueada — configúrala en tu .env antes de usar Atlas normalmente.");
}

export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach(pair => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) { try { out[k] = decodeURIComponent(v); } catch { out[k] = v; } }
  });
  return out;
}

export function signSession(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifySession(token?: string): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.indexOf(".");
    if (dot === -1) return false;
    const payload = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    const expires = parseInt(payload, 10);
    return Number.isFinite(expires) && Date.now() < expires;
  } catch {
    return false;
  }
}

// Freno sencillo de fuerza bruta: máximo 8 intentos de login por IP y minuto.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 8;
}
