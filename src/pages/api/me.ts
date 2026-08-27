import type { APIRoute } from "astro";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const authed = verifyToken(cookies.get(COOKIE_NAME)?.value);
  return new Response(JSON.stringify({ authed }), { headers: { "content-type": "application/json" } });
};
