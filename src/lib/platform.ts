/**
 * Runtime environment abstraction.
 *
 * The production target is Cloudflare Workers: bindings (DB,
 * MEDIA_PUBLIC_BASE_URL) are injected by the Astro Cloudflare adapter via
 * `Astro.locals.runtime.env`.
 *
 * Local development can either:
 *  1. Run `wrangler dev` which exposes the same bindings, OR
 *  2. Use the optional `data/*.json` fallback in src/lib/db/fallback.ts when
 *     no binding is present (offline mode). Production never reads JSON.
 *
 * IMPORTANT: this module is the ONLY place that touches Cloudflare-specific
 * globals. Everything else in the app talks to `getDb()` /
 * `getPublicAssetUrl()`.
 */

import type { D1Database } from "@cloudflare/workers-types";

/** Shape of the bindings the Worker exposes. Mirrors wrangler.toml. */
export interface CloudflareBindings {
  /** D1 database binding. Name must match `[d1_databases].binding` in wrangler.toml. */
  DB: D1Database;
  /** Public origin serving media (e.g. R2 public hostname, CDN, or repo path). */
  MEDIA_PUBLIC_BASE_URL?: string;
  /** Optional override for `AUTH_SECRET` in production. */
  AUTH_SECRET?: string;
  /** Optional override for `ADMIN_SECRET` in production. */
  ADMIN_SECRET?: string;
}

/** Detected environment after `getPlatform` runs. */
export interface PlatformEnv {
  /** Whether we are running inside a Cloudflare Worker with bindings. */
  isCloudflare: boolean;
  db?: D1Database;
  mediaPublicBaseUrl: string;
  // Per-call secrets — kept on the platform object so callers don't reach
  // into process.env themselves.
  authSecret?: string;
  adminSecret?: string;
}

const DEFAULT_MEDIA_BASE = "https://media.jabaridental.com";

/**
 * Resolve the platform environment for the current request.
 *
 * Accepts either Astro's `locals` (which carries `runtime.env` on the
 * Cloudflare adapter) or a plain `env` (for tests and scripts).
 */
export function getPlatform(locals?: { runtime?: { env?: unknown } }): PlatformEnv {
  const cfEnv = (locals?.runtime?.env as unknown as CloudflareBindings | undefined) ?? undefined;
  if (cfEnv && cfEnv.DB) {
    return {
      isCloudflare: true,
      db: cfEnv.DB,
      mediaPublicBaseUrl: stripSlash(cfEnv.MEDIA_PUBLIC_BASE_URL || DEFAULT_MEDIA_BASE),
      authSecret: cfEnv.AUTH_SECRET,
      adminSecret: cfEnv.ADMIN_SECRET,
    };
  }
  // Fallback for local dev when bindings are missing (e.g. plain `astro dev`
  // without `wrangler dev`). Production builds always have bindings.
  const proc = (globalThis as any).process?.env ?? {};
  return {
    isCloudflare: false,
    db: undefined,
    mediaPublicBaseUrl: stripSlash(proc.MEDIA_PUBLIC_BASE_URL || DEFAULT_MEDIA_BASE),
    authSecret: proc.AUTH_SECRET,
    adminSecret: proc.ADMIN_SECRET,
  };
}

function stripSlash(u: string): string {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

/**
 * Build the public delivery URL for an R2 object key.
 *   getPublicAssetUrl(platform, "uploads/2024/05/abc.jpg")
 *     -> "https://media.jabaridental.com/uploads/2024/05/abc.jpg"
 */
export function getPublicAssetUrl(platform: PlatformEnv, objectKey: string): string {
  const k = objectKey.replace(/^\/+/, "");
  return `${platform.mediaPublicBaseUrl}/${k}`;
}