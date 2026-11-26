// Stateless signed-cookie admin session using Web Crypto (works in middleware and server actions).
const enc = new TextEncoder();
export const COOKIE = "fk_admin";
const TTL_MS = 8 * 3600 * 1000;

async function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (>= 32 chars)");
  return crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (h: string) => new Uint8Array(h.match(/../g)?.map((x) => parseInt(x, 16)) ?? []);

export async function signSession(): Promise<string> {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${hex(await crypto.subtle.sign("HMAC", await key(), enc.encode(exp)))}`;
}
export async function verifySession(v: string | undefined): Promise<boolean> {
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now() || !/^[0-9a-f]{64}$/.test(sig)) return false;
  try { return await crypto.subtle.verify("HMAC", await key(), unhex(sig), enc.encode(exp)); } catch { return false; }
}
/** Constant-time compare via HMAC of both values. */
export async function passwordOk(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 12) return false;
  const k = await key();
  const [a, b] = await Promise.all([crypto.subtle.sign("HMAC", k, enc.encode(input)), crypto.subtle.sign("HMAC", k, enc.encode(expected))]);
  return hex(a) === hex(b);
}
