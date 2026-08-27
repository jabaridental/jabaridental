import type { APIRoute } from "astro";
import { readRaw, writeRaw, createItem, listCollection } from "@/lib/store";
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

export const GET: APIRoute = async ({ params }) => {
  const key = params.collection as string;
  if (!isKey(key)) return new Response(JSON.stringify({ ok: false, error: "Unknown collection" }), { status: 400 });
  const data = await readRaw(key);
  return new Response(JSON.stringify({ ok: true, data }), { headers: { "content-type": "application/json" } });
};

export const POST: APIRoute = async ({ params, request }) => {
  const key = params.collection as string;
  if (!isKey(key)) return new Response(JSON.stringify({ ok: false, error: "Unknown collection" }), { status: 400 });
  if (SINGLE.has(key)) {
    const body = await request.json().catch(() => ({}));
    await writeRaw(key, { ...(await readRaw(key)), ...body });
    return new Response(JSON.stringify({ ok: true, data: await readRaw(key) }), { headers: { "content-type": "application/json" } });
  }
  const body = await request.json().catch(() => ({}));
  const item = await createItem(key, body);
  return new Response(JSON.stringify({ ok: true, data: item }), { status: 201, headers: { "content-type": "application/json" } });
};
