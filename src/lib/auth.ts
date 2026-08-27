import crypto from "node:crypto";

const COOKIE = "jab_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
}

function adminSecret(): string {
  return process.env.ADMIN_SECRET || "change-me-in-production";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(payload).digest());
}

export function createToken(): string {
  const payload = b64url(JSON.stringify({ t: Date.now(), n: crypto.randomBytes(8).toString("hex") }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  // timing-safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (!data.t || Date.now() - data.t > MAX_AGE * 1000 * 12) return false;
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(password: string): boolean {
  const a = Buffer.from(password);
  const b = Buffer.from(adminSecret());
  if (a.length !== b.length) {
    // still run a compare to reduce timing hint without leaking
    crypto.timingSafeEqual(Buffer.from(adminSecret()), Buffer.from(adminSecret()));
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export const COOKIE_NAME = COOKIE;
export const COOKIE_MAX_AGE = MAX_AGE;

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  };
}
