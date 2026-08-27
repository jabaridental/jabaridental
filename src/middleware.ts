import { defineMiddleware } from "astro/middleware";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const PUBLIC_API = ["/api/auth/login", "/api/auth/logout", "/api/me"];

export const onRequest = defineMiddleware(async ({ request, url, cookies, redirect }, next) => {
  const path = url.pathname;

  // API protection
  if (path.startsWith("/api/")) {
    if (PUBLIC_API.includes(path)) return next();
    const authed = verifyToken(cookies.get(COOKIE_NAME)?.value);
    if (!authed) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    return next();
  }

  // Studio protection
  if (path.startsWith("/studio")) {
    if (path === "/studio/login") return next();
    const authed = verifyToken(cookies.get(COOKIE_NAME)?.value);
    if (!authed) return redirect("/studio/login");
    return next();
  }

  return next();
});
