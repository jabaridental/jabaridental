/**
 * Cloudflare R2 upload module.
 *
 * Replaces the previous filesystem-based `/api/upload` handler. R2 has no
 * directory tree, so we generate a date-prefixed object key:
 *
 *   uploads/YYYY/MM/<random>.<ext>
 *
 * MIME types are validated against an allow-list and the extension is
 * derived from the verified MIME type (never the client filename) so a
 * file called "evil.html" cannot be saved as an HTML document. SVG is
 * rejected entirely (SVG can host active content).
 *
 * The function returns the public delivery URL produced by
 * `getPublicAssetUrl()` so the website layer doesn't care where the bytes
 * actually live.
 */
import { getPlatform, getPublicAssetUrl } from "./platform";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
// SVG is intentionally NOT allowed. SVG can contain <script>, onload= handlers,
// foreignObject, etc. — even sanitized SVGs have a track record of bypasses.
// If the clinic really needs SVG logo uploads in the future, add a strict
// sanitizer (e.g. DOMPurify in a Worker) and a separate endpoint.

const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadResult {
  ok: true;
  objectKey: string;
  url: string;
  alt: string;
  focalX: number;
  focalY: number;
  bytes: number;
  mime: string;
  mediaId: string;
}

export interface UploadError {
  ok: false;
  status: number;
  error: string;
}

/**
 * Upload a multipart "file" field plus optional alt / focal metadata.
 * Caller is responsible for parsing formData. Returns a structured result so
 * the API route can map it to JSON.
 */
export async function uploadToR2(
  file: File,
  meta: { alt?: string; focalX?: number; focalY?: number } = {},
  locals?: { runtime?: { env?: unknown } },
): Promise<UploadResult | UploadError> {
  if (!file || typeof file === "string") {
    return { ok: false, status: 400, error: "No file" };
  }
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return { ok: false, status: 400, error: "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, status: 400, error: "File too large (10 MB max)" };
  }
  // Reject anything with embedded executables by sniffing magic bytes for the
  // most permissive image type. This is defense-in-depth — the MIME type from
  // the multipart envelope is the primary check.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!looksLikeImage(file.type, head)) {
    return { ok: false, status: 400, error: "File contents do not match the declared image type" };
  }

  const env = getPlatform(locals);
  if (!env.mediaBucket) {
    return { ok: false, status: 500, error: "R2 bucket binding is not configured" };
  }

  // Generate a date-prefixed key. Year/month gives an even spread; the random
  // suffix prevents enumeration / collisions and stops path traversal.
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const objectKey = `uploads/${y}/${m}/${rand}.${ext}`;

  const body = await file.arrayBuffer();
  await env.mediaBucket.put(objectKey, body, {
    httpMetadata: {
      contentType: file.type,
      // 1 year. R2-backed images are content-addressed by their public URL
      // (which is rewritten through the public hostname), so long caching is
      // safe and helps LCP.
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      alt: meta.alt ?? "",
      focalX: String(meta.focalX ?? 50),
      focalY: String(meta.focalY ?? 50),
      originalName: sanitizeFilename(file.name ?? ""),
    },
  });

  // Persist metadata in D1 so the studio can list/clean uploads.
  const id = crypto.randomUUID();
  if (env.db) {
    await env.db.prepare(
      `INSERT INTO media (id, object_key, url, mime, bytes, alt, focal_x, focal_y)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      objectKey,
      getPublicAssetUrl(env, objectKey),
      file.type,
      file.size,
      meta.alt ?? "",
      Math.max(0, Math.min(100, Math.round(meta.focalX ?? 50))),
      Math.max(0, Math.min(100, Math.round(meta.focalY ?? 50))),
    ).run();
  }

  return {
    ok: true,
    objectKey,
    url: getPublicAssetUrl(env, objectKey),
    alt: meta.alt ?? "",
    focalX: meta.focalX ?? 50,
    focalY: meta.focalY ?? 50,
    bytes: file.size,
    mime: file.type,
    mediaId: id,
  };
}

/** Minimal magic-byte sniff for the formats we accept. */
function looksLikeImage(mime: string, head: Uint8Array): boolean {
  const h = (n: number) => head[n];
  if (mime === "image/jpeg" && h(0) === 0xff && h(1) === 0xd8 && h(2) === 0xff) return true;
  if (mime === "image/png" && h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4e && h(3) === 0x47) return true;
  if (mime === "image/gif" && h(0) === 0x47 && h(1) === 0x49 && h(2) === 0x46) return true;
  if (mime === "image/webp" && h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46
      && h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50) return true;
  return false;
}

/** Strip path components and dangerous characters from the original filename. */
function sanitizeFilename(name: string): string {
  // Take only the basename (no slashes), replace anything outside [A-Za-z0-9._-]
  const base = name.split(/[/\\]/).pop() || "upload";
  return base.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
}