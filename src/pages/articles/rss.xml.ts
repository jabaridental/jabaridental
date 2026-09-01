import type { APIRoute } from "astro";
import { getArticles } from "@/lib/store";

export const prerender = false;

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
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const GET: APIRoute = async ({ site, url }) => {
  const base = (site?.href || `${url.protocol}//${url.host}/`).replace(/\/$/, "");
  const articles = await getArticles();

  const items = articles
    .filter((a) => a?.slug)
    .map((a) => {
      const link = `${base}/articles/${a.slug}/`;
      const pubDate = isoDate(a.publishedDate);
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <description>${esc(a.excerpt || "")}</description>
      ${a.author ? `<author>${esc(a.author)}</author>` : ""}
      ${pubDate ? `<pubDate>${new Date(pubDate).toUTCString()}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>JABARI DENTAL — Articles</title>
    <link>${esc(base)}/articles</link>
    <description>Careful, useful reading on oral health and your visit.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      // Cache for 10 minutes; the content store reads cheaply so this is a
      // free win on repeat hits without serving truly stale content.
      "cache-control": "public, max-age=600",
    },
  });
};