import type { APIRoute } from "astro";
import { isCollectionKey, SINGLE, upsertSingle, updateItem, deleteItem, reorderItem } from "@/lib/db";
import { validateCollectionBody } from "@/lib/schemas";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export const PUT: APIRoute = async ({ params, request, url, locals }) => {
  const key = params.collection as string;
  const id = params.id as string;
  if (!isCollectionKey(key)) return json({ ok: false, error: "Unknown collection" }, 400);

  if (url.searchParams.has("reorder")) {
    const dir = url.searchParams.get("dir") === "up" ? "up" : "down";
    const ok = await reorderItem(key, id, dir, locals);
    return json({ ok });
  }

  const raw = await request.json().catch(() => ({}));
  const validation = validateCollectionBody(key, raw);
  if (!validation.ok) return json({ ok: false, error: validation.error }, 400);

  const data = SINGLE.has(key)
    ? await upsertSingle(key, validation.value, locals)
    : await updateItem(key, id, validation.value, locals);
  if (!data && !SINGLE.has(key)) return json({ ok: false, error: "Not found" }, 404);
  return json({ ok: true, data });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const key = params.collection as string;
  const id = params.id as string;
  if (!isCollectionKey(key) || SINGLE.has(key)) {
    return json({ ok: false, error: "Not allowed" }, 400);
  }
  const ok = await deleteItem(key, id, locals);
  return json({ ok }, ok ? 200 : 404);
};