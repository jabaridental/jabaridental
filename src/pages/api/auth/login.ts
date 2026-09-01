import type { APIRoute } from "astro";
import { checkPassword, createToken, COOKIE_NAME, cookieOptions } from "@/lib/auth";

export const prerender = false;

// ---- Brute-force protection -------------------------------------------------
// In-memory sliding window per client IP. This is intentionally simple and has
// no external dependency; it resets on restart, which is acceptable for a
// single-admin studio. For multi-instance deploys, move this to shared storage.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 8; // failed attempts allowed per window
const LOCKOUT_MS = 15 * 60 * 1000; // how long to block after exceeding
const MIN_RESPONSE_MS = 400; // constant-ish floor to slow down guessing

type Entry = { fails: number[]; blockedUntil: number };
const attempts = new Map<string, Entry>();

function prune(now: number) {
  // keep the map from growing without bound
  for (const [ip, e] of attempts) {
    e.fails = e.fails.filter((t) => now - t < WINDOW_MS);
    if (e.fails.length === 0 && e.blockedUntil < now) attempts.delete(ip);
  }
}

function getEntry(ip: string): Entry {
  let e = attempts.get(ip);
  if (!e) {
    e = { fails: [], blockedUntil: 0 };
    attempts.set(ip, e);
  }
  return e;
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

export const POST: APIRoute = async ({ request, cookies, clientAddress, locals }) => {
  const started = Date.now();
  const ip = clientAddress || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  prune(started);
  const entry = getEntry(ip);

  if (entry.blockedUntil > started) {
    const retryAfter = Math.ceil((entry.blockedUntil - started) / 1000);
    return json(
      { ok: false, error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` },
      429,
      { "retry-after": String(retryAfter) }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof (body as any)?.password === "string" ? (body as any).password : "";

  let ok = false;
  try {
    ok = checkPassword(password, locals.platform);
  } catch (err) {
    console.error("[auth] login blocked:", (err as Error).message);
    return json({ ok: false, error: "Server auth is not configured. Contact the administrator." }, 500);
  }

  if (!ok) {
    entry.fails.push(started);
    entry.fails = entry.fails.filter((t) => started - t < WINDOW_MS);
    if (entry.fails.length >= MAX_ATTEMPTS) {
      entry.blockedUntil = started + LOCKOUT_MS;
      entry.fails = [];
      console.warn(`[auth] IP ${ip} locked out after ${MAX_ATTEMPTS} failed studio logins`);
    }
    const elapsed = Date.now() - started;
    if (elapsed < MIN_RESPONSE_MS) await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));

    const remaining = Math.max(0, MAX_ATTEMPTS - entry.fails.length);
    return json({
      ok: false,
      error: remaining > 0 ? "Invalid password" : "Too many attempts. Try again later.",
    }, 401);
  }

  attempts.delete(ip);
  cookies.set(COOKIE_NAME, createToken(locals.platform), cookieOptions(locals.platform));
  return json({ ok: true });
};
