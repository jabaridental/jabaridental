import type { APIRoute } from "astro";
import { COOKIE_NAME } from "@/lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(COOKIE_NAME, { path: "/" });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
};
