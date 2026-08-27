import type { APIRoute } from "astro";
import { checkPassword, createToken, COOKIE_NAME, cookieOptions } from "@/lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";
  if (!checkPassword(password)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid password" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  cookies.set(COOKIE_NAME, createToken(), cookieOptions());
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
};
