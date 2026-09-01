import type { APIRoute } from "astro";
import { isCollectionKey, listAll, upsertSingle } from "@/lib/db";
import { SINGLE } from "@/lib/db";
import { validateCollectionBody } from "@/lib/schemas";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.collection as string;
  if (!isCollectionKey(key)) return json({ ok: false, error: "Unknown collection" }, 400);
  const data = await listAll(key, locals);
  if (SINGLE.has(key)) {
    // listAll returns an array; for SINGLE the admin wants an object.
    return json({ ok: true, data: (data as any[])[0] ?? null });
  }
  return json({ ok: true, data });
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const key = params.collection as string;
  if (!isCollectionKey(key)) return json({ ok: false, error: "Unknown collection" }, 400);
  const raw = await request.json().catch(() => ({}));
  const validation = validateCollectionBody(key, raw);
  if (!validation.ok) return json({ ok: false, error: validation.error }, 400);
  const data = SINGLE.has(key)
    ? await upsertSingle(key, validation.value, locals)
    : await import("@/lib/db").then((m) => m.createItem(key, validation.value, locals));
  return json({ ok: true, data }, SINGLE.has(key) ? 200 : 201);
};