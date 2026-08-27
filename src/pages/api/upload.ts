import type { APIRoute } from "astro";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const prerender = false;

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX = 10 * 1024 * 1024;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ ok: false, error: "No file" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  if (!ALLOWED.includes(file.type)) {
    return new Response(JSON.stringify({ ok: false, error: "Unsupported file type" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  if (file.size > MAX) {
    return new Response(JSON.stringify({ ok: false, error: "File too large (10MB max)" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  const ext = (file.name.split(".").pop() || "bin").slice(0, 8).replace(/[^a-z0-9]/gi, "");
  const name = crypto.randomBytes(12).toString("hex") + "." + ext;
  const dir = path.join(process.cwd(), "public", "images", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, name), buf);
  return new Response(JSON.stringify({ ok: true, src: `/images/uploads/${name}` }), { headers: { "content-type": "application/json" } });
};
