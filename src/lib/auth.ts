import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { PlatformEnv } from "./platform";

const COOKIE = "jab_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

const DEV_AUTH_FALLBACK = "dev-only-insecure-secret-change-me";
const DEV_ADMIN_FALLBACK = "change-me-in-production";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function env(name: string, platform?: PlatformEnv): string | undefined {
  // Priority: Cloudflare binding > process.env (dev/local) > import.meta.env (Astro build-time).
  if (platform && (platform as any)[name]) return (platform as any)[name];
  if (process.env[name]) return process.env[name];
  return (import.meta.env as Record<string, any>)?.[name];
}

function secret(platform?: PlatformEnv): string {
  const v = env("AUTH_SECRET", platform);
  if (!v || v === DEV_AUTH_FALLBACK) {
    if (isProd()) {
      throw new Error(
        "AUTH_SECRET is not set. Refusing to sign admin sessions with an insecure default. " +
          "Set AUTH_SECRET as a Cloudflare secret or local env var (32+ chars)."
      );
    }
    return DEV_AUTH_FALLBACK;
  }
  return v;
}

function adminSecret(platform?: PlatformEnv): string {
  const v = env("ADMIN_SECRET", platform);
  if (!v || v === DEV_ADMIN_FALLBACK) {
    if (isProd()) {
      throw new Error(
        "ADMIN_SECRET is not set (or still the placeholder). Refusing to accept a default admin password. " +
          "Set ADMIN_SECRET as a Cloudflare secret or local env var."
      );
    }
    return DEV_ADMIN_FALLBACK;
  }
  return v;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string, platform?: PlatformEnv): string {
  return b64url(createHmac("sha256", secret(platform)).update(payload).digest());
}

export function createToken(platform?: PlatformEnv): string {
  const payload = b64url(JSON.stringify({ t: Date.now(), n: randomBytes(8).toString("hex") }));
  return `${payload}.${sign(payload, platform)}`;
}

export function verifyToken(token: string | undefined | null, platform?: PlatformEnv): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload, platform);
  // timing-safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (!data.t || Date.now() - data.t > MAX_AGE * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(password: string, platform?: PlatformEnv): boolean {
  // Hash both sides to a fixed length so the comparison never leaks the
  // secret's length via an early return.
  const expected = createHash("sha256").update(adminSecret(platform)).digest();
  const given = createHash("sha256").update(String(password ?? "")).digest();
  return timingSafeEqual(given, expected);
}

export const COOKIE_NAME = COOKIE;
export const COOKIE_MAX_AGE = MAX_AGE;

export function cookieOptions(platform?: PlatformEnv) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    // Default to secure unless explicitly running plain HTTP locally.
    secure: isProd() || env("FORCE_SECURE_COOKIE", platform) === "true",
    maxAge: MAX_AGE,
  };
}
