import type { APIRoute } from "astro";
import { getTreatments, getArticles } from "@/lib/store";

export const prerender = false;

/**
 * Sitemap for content-driven detail pages.
 *
 * @astrojs/sitemap can only enumerate static routes, so in `output: 'server'`
 * mode it emits the top-level pages but omits every `/treatments/[slug]` and
 * `/articles/[slug]` URL — which are exactly the pages that matter most for
 * local search ("dental implants Kampala", etc.). This route lists them from
 * the live content store so it always reflects what is actually published.
 *
 * It is advertised as a second `Sitemap:` entry in robots.txt; search engines
 * accept multiple sitemap declarations.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

export const GET: APIRoute = async ({ site, url }) => {
  const base = (site?.href || `${url.protocol}//${url.host}/`).replace(/\/$/, "");

  const [treatments, articles] = await Promise.all([getTreatments(), getArticles()]);

  const entries: Array<{ loc: string; lastmod?: string; priority: string }> = [];

  for (const t of treatments) {
    if (!t?.slug) continue;
    entries.push({
      loc: `${base}/treatments/${t.slug}/`,
      lastmod: isoDate((t as any).updatedAt),
      priority: "0.9",
    });
  }

  for (const a of articles) {
    if (!a?.slug) continue;
    entries.push({
      loc: `${base}/articles/${a.slug}/`,
      lastmod: isoDate((a as any).updatedDate) || isoDate((a as any).publishedDate),
      priority: "0.7",
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>${e.priority}</priority></url>`
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600",
    },
  });
};
