import type { APIRoute } from "astro";

export const prerender = false;

// Lightweight health endpoint for uptime monitors. Returns 200 unconditionally
// so a worker that can serve HTTP is considered healthy. Does NOT touch the
// content store — that would force a disk read on every probe and could mask
// real outages behind a slow filesystem.
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ ok: true, name: "jabari-dental", version: "1.0.0" }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Never cache health responses.
        "cache-control": "no-store",
      },
    }
  );
};