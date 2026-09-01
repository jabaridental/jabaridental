import type { APIRoute } from "astro";
import { uploadToR2 } from "@/lib/media";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string" || !(file instanceof File)) {
    return json({ ok: false, error: "No file" }, 400);
  }

  // Optional metadata the studio sends alongside the file.
  const alt = (form?.get("alt") as string | null) ?? "";
  const fx = Number((form?.get("focalX") as string | null) ?? "50");
  const fy = Number((form?.get("focalY") as string | null) ?? "50");

  const result = await uploadToR2(
    file,
    { alt, focalX: Number.isFinite(fx) ? fx : 50, focalY: Number.isFinite(fy) ? fy : 50 },
    locals as any,
  );

  if (!result.ok) return json({ ok: false, error: result.error }, result.status);

  return json({
    ok: true,
    src: result.url, // The public delivery URL — replaces the previous filesystem path.
    objectKey: result.objectKey,
    alt: result.alt,
    focalX: result.focalX,
    focalY: result.focalY,
    mediaId: result.mediaId,
  });
};