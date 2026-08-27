import type { APIRoute } from "astro";
import { readRaw, writeRaw, updateItem, deleteItem, reorderItem } from "@/lib/store";
import type { CollectionKey } from "@/lib/types";

export const prerender = false;

const SINGLE = new Set(["site", "hero", "contact"]);
const ARRAYS = new Set([
  "announcements",
  "offers",
  "treatments",
  "team",
  "gallery",
  "beforeAfter",
  "testimonials",
  "articles",
  "faqs",
  "social",
  "specialHours",
  "hours",
]);

function isKey(k: string): k is CollectionKey {
  return SINGLE.has(k) || ARRAYS.has(k);
}

export const PUT: APIRoute = async ({ params, request }) => {
  const key = params.collection as string;
  const id = params.id as string;
  if (!isKey(key)) return new Response(JSON.stringify({ ok: false, error: "Unknown collection" }), { status: 400 });

  const url = new URL(request.url);
  if (url.searchParams.get("reorder")) {
    const dir = url.searchParams.get("dir") === "up" ? "up" : "down";
    const ok = await reorderItem(key, id, dir);
    return new Response(JSON.stringify({ ok }), { headers: { "content-type": "application/json" } });
  }

  if (SINGLE.has(key)) {
    const body = await request.json().catch(() => ({}));
    await writeRaw(key, { ...(await readRaw(key)), ...body });
    return new Response(JSON.stringify({ ok: true, data: await readRaw(key) }), { headers: { "content-type": "application/json" } });
  }
  const body = await request.json().catch(() => ({}));
  const item = await updateItem(key, id, body);
  if (!item) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify({ ok: true, data: item }), { headers: { "content-type": "application/json" } });
};

export const DELETE: APIRoute = async ({ params }) => {
  const key = params.collection as string;
  const id = params.id as string;
  if (!isKey(key) || SINGLE.has(key)) return new Response(JSON.stringify({ ok: false, error: "Not allowed" }), { status: 400 });
  const ok = await deleteItem(key, id);
  return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 404, headers: { "content-type": "application/json" } });
};
