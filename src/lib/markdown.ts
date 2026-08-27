// Lightweight, XSS-safe renderer for article body content.
// Supports: paragraphs, "## " subheadings, ![alt](src) images, **bold** inline.
// All text is HTML-escaped before formatting is applied.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return out;
}

export function renderArticle(body: string): string {
  const blocks = body.split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // image
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      const alt = escapeHtml(imgMatch[1]);
      const src = escapeHtml(imgMatch[2]);
      html.push(
        `<figure class="my-10"><img src="${src}" alt="${alt}" loading="lazy" class="w-full rounded-md shadow-soft" /><figcaption class="mt-3 text-sm text-stone">${alt}</figcaption></figure>`
      );
      continue;
    }

    // heading
    if (trimmed.startsWith("## ")) {
      html.push(`<h2 class="font-display text-2xl md:text-3xl mt-14 mb-4 text-ink">${inline(trimmed.slice(3))}</h2>`);
      continue;
    }

    // paragraph
    const paras = trimmed
      .split(/\n/)
      .map((l) => inline(l))
      .join("<br />");
    html.push(`<p class="mb-6 text-stone leading-relaxed text-lg">${paras}</p>`);
  }

  return html.join("\n");
}

export function plainText(body: string, len = 160): string {
  const t = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/##\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return t.length > len ? t.slice(0, len).trim() + "…" : t;
}
