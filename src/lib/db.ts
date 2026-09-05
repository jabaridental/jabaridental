/**
 * D1-backed content store.
 *
 * Every public getter preserves the filtering behaviour of the previous
 * file-backed `src/lib/store.ts`:
 *
 *   - Announcements: published + within [startDate, endDate], priority-sorted
 *   - Offers:         active + within [validFrom, validUntil], featured-first
 *   - Treatments:     published && active, by displayOrder
 *   - Team:           published, by displayOrder
 *   - Gallery:        published, featured-first then displayOrder
 *   - Before/After:   published && approval=approved && consent=true
 *   - Testimonials:   published && approved, featured-first then displayOrder
 *   - Articles:       published, featured-first then publishedDate desc
 *   - FAQs:           published, by displayOrder
 *
 * JSON-shaped columns (`image`, `faqs`, `tags`, `specialties`) are stringified
 * SQLite TEXT; the application layer parses them lazily so we don't pay the
 * JSON parse cost for collections it doesn't read.
 */
import { getPlatform, type PlatformEnv } from "./platform";
import type {
  SiteSettings,
  Hero,
  ContactSettings,
  Treatment,
  Article,
  GalleryItem,
  TeamMember,
  Testimonial,
  BeforeAfterCase,
  Faq,
  Announcement,
  Offer,
  SocialLink,
  SpecialHours,
  DayHours,
  ImageRef,
} from "./types";

type CollectionKey =
  | "site" | "hero" | "contact"
  | "treatments" | "team" | "gallery" | "beforeAfter"
  | "testimonials" | "articles" | "faqs" | "announcements" | "offers"
  | "hours" | "specialHours" | "social";

export const SINGLE: ReadonlySet<CollectionKey> = new Set<CollectionKey>([
  "site", "hero", "contact",
]);

export const ARRAYS: ReadonlySet<CollectionKey> = new Set<CollectionKey>([
  "treatments", "team", "gallery", "beforeAfter",
  "testimonials", "articles", "faqs", "announcements", "offers",
  "hours", "specialHours", "social",
]);

export function isCollectionKey(k: string): k is CollectionKey {
  return SINGLE.has(k as CollectionKey) || ARRAYS.has(k as CollectionKey);
}

// ---------- helpers ---------------------------------------------------------

function parse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function safeImg(raw: string | null | undefined): ImageRef {
  return parse<ImageRef>(raw, { src: "", alt: "", focalX: 50, focalY: 50 });
}

function rowToTreatment(r: any): Treatment {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    shortDescription: r.short_description,
    longDescription: r.long_description,
    image: safeImg(r.image),
    icon: r.icon || "",
    duration: r.duration || "",
    price: r.price || "",
    priceVisible: !!r.price_visible,
    faqs: parse(r.faqs, []),
    seoTitle: r.seo_title || "",
    seoDescription: r.seo_description || "",
    featured: !!r.featured,
    active: !!r.active,
    published: !!r.published,
    displayOrder: r.display_order ?? 0,
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

function rowToArticle(r: any): Article {
  return {
    id: r.id, slug: r.slug, title: r.title,
    excerpt: r.excerpt || "",
    body: r.body || "",
    featuredImage: safeImg(r.featured_image),
    author: r.author || "",
    category: r.category || "",
    tags: parse<string[]>(r.tags, []),
    publishedDate: r.published_date || "",
    updatedDate: r.updated_date || "",
    seoTitle: r.seo_title || "",
    seoDescription: r.seo_description || "",
    socialImage: safeImg(r.social_image),
    featured: !!r.featured,
    published: !!r.published,
    displayOrder: r.display_order ?? 0,
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

function rowToGallery(r: any): GalleryItem {
  return {
    id: r.id, title: r.title, category: r.category,
    description: r.description || "",
    image: safeImg(r.image),
    alt: r.alt || "",
    date: r.date || "",
    featured: !!r.featured, published: !!r.published,
    displayOrder: r.display_order ?? 0,
  };
}

function rowToTeam(r: any): TeamMember {
  return {
    id: r.id, name: r.name, role: r.role,
    photo: safeImg(r.photo),
    biography: r.biography || "",
    specialties: parse<string[]>(r.specialties, []),
    credentials: r.credentials || "",
    displayOrder: r.display_order ?? 0,
    published: !!r.published,
  };
}

function rowToTestimonial(r: any): Testimonial {
  return {
    id: r.id, displayName: r.display_name, quote: r.quote,
    rating: r.rating ?? 5, date: r.date || "",
    isDemo: !!r.is_demo, approved: !!r.approved,
    featured: !!r.featured, published: !!r.published,
    displayOrder: r.display_order ?? undefined,
  };
}

function rowToBeforeAfter(r: any): BeforeAfterCase {
  return {
    id: r.id, treatmentName: r.treatment_name,
    description: r.description || "",
    duration: r.duration || "",
    beforeImage: safeImg(r.before_image),
    afterImage: safeImg(r.after_image),
    consent: !!r.consent,
    approval: (r.approval || "draft") as any,
    published: !!r.published,
    displayOrder: r.display_order ?? 0,
  };
}

function rowToAnnouncement(r: any): Announcement {
  return {
    id: r.id, title: r.title,
    message: r.message || "",
    ctaLabel: r.cta_label || "",
    ctaUrl: r.cta_url || "",
    startDate: r.start_date, endDate: r.end_date,
    priority: (r.priority || "normal") as any,
    published: !!r.published,
    style: (r.style || "bar") as any,
  };
}

function rowToOffer(r: any): Offer {
  return {
    id: r.id, title: r.title,
    description: r.description || "",
    image: safeImg(r.image),
    validFrom: r.valid_from, validUntil: r.valid_until,
    ctaLabel: r.cta_label || "",
    whatsappMessage: r.whatsapp_message || "",
    active: !!r.active, featured: !!r.featured,
  };
}

function rowToFaq(r: any): Faq {
  return {
    id: r.id, question: r.question, answer: r.answer,
    displayOrder: r.display_order ?? 0,
    published: !!r.published,
  };
}

function rowToSocial(r: any): SocialLink {
  return {
    id: r.id, label: r.label, url: r.url,
    displayOrder: r.display_order ?? 0,
    published: !!r.published,
  };
}

function rowToDayHours(r: any): DayHours {
  return {
    id: r.id, day: r.day as any, label: r.label,
    closed: !!r.closed,
    open: r.open || "", close: r.close || "",
    open2: r.open2 || "", close2: r.close2 || "",
  };
}

function rowToSpecialHours(r: any): SpecialHours {
  return {
    id: r.id, label: r.label, date: r.date,
    closed: !!r.closed,
    open: r.open || "", close: r.close || "",
    note: r.note || "",
  };
}

// ---------- Public getters --------------------------------------------------

// `db.getX(locals?)` is called from two places:
//   - Astro frontmatter: `await getSite(Astro.locals)` (full App.Locals)
//   - API routes:       `await getX(locals)` (also full App.Locals)
// The store façade in ./store.ts also passes its trimmed LocalsLike.
// We accept any object that has a `platform` field, so all callers work.
type AnyLocals =
  | { platform: import("./platform").PlatformEnv; runtime?: { env?: unknown } }
  | { runtime?: { env?: unknown } }
  | undefined;

function envOf(locals?: AnyLocals) {
  if (!locals) return getPlatform();
  return getPlatform(locals as any);
}

async function mustDb(env: PlatformEnv) {
  if (!env.db) throw new Error("D1 binding missing: configure wrangler.toml with [[d1_databases]] and rebuild.");
  return env.db;
}

export async function getSite(locals?: AnyLocals): Promise<SiteSettings> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const r = await env.db.prepare("SELECT * FROM site WHERE id = ?").bind("site").first<any>();
  if (!r) throw new Error("site row missing — run db migrations and seed");
  return {
    name: r.name, shortName: r.short_name, tagline: r.tagline,
    location: r.location, country: r.country, description: r.description,
    brandColors: { primary: r.brand_primary, accent: r.brand_accent },
    logoText: r.logo_text,
  };
}

export async function getHero(locals?: AnyLocals): Promise<Hero> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const r = await env.db.prepare("SELECT * FROM hero WHERE id = ?").bind("hero").first<any>();
  if (!r) throw new Error("hero row missing — run db migrations and seed");
  return {
    eyebrow: r.eyebrow, headline: r.headline, headlineAccent: r.headline_accent,
    subhead: r.subhead, primaryCtaLabel: r.primary_cta_label,
    secondaryCtaLabel: r.secondary_cta_label, whatsappLabel: r.whatsapp_label,
    statusNote: r.status_note,
    image: safeImg(r.image),
    imageMobile: r.image_mobile ? safeImg(r.image_mobile) : undefined,
  };
}

export async function getContact(locals?: AnyLocals): Promise<ContactSettings> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const r = await env.db.prepare("SELECT * FROM contact WHERE id = ?").bind("contact").first<any>();
  if (!r) throw new Error("contact row missing — run db migrations and seed");
  return {
    phone: r.phone, whatsapp: r.whatsapp, email: r.email || "",
    mapsUrl: r.maps_url,
    addressVerified: r.address_verified, addressNote: r.address_note,
  };
}

export async function getHours(locals?: AnyLocals): Promise<DayHours[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db.prepare("SELECT * FROM hours ORDER BY id ASC").all<any>();
  return (results ?? []).map(rowToDayHours);
}

export async function getSpecialHours(locals?: AnyLocals): Promise<SpecialHours[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db.prepare("SELECT * FROM special_hours ORDER BY date ASC").all<any>();
  return (results ?? []).map(rowToSpecialHours);
}

export async function getSocial(locals?: AnyLocals): Promise<SocialLink[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db
    .prepare("SELECT * FROM social WHERE published = 1 ORDER BY display_order ASC")
    .all<any>();
  return (results ?? []).map(rowToSocial);
}

export async function getAnnouncements(locals?: AnyLocals): Promise<Announcement[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const today = new Date().toISOString().slice(0, 10);
  const { results } = await env.db
    .prepare(`SELECT * FROM announcements
              WHERE published = 1 AND start_date <= ? AND end_date >= ?
              ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END ASC`)
    .bind(today, today).all<any>();
  return (results ?? []).map(rowToAnnouncement);
}

export async function getOffers(locals?: AnyLocals): Promise<Offer[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const today = new Date().toISOString().slice(0, 10);
  const { results } = await env.db
    .prepare(`SELECT * FROM offers
              WHERE active = 1 AND valid_from <= ? AND valid_until >= ?
              ORDER BY featured DESC`)
    .bind(today, today).all<any>();
  return (results ?? []).map(rowToOffer);
}

export async function getTreatments(onlyPublished = true, locals?: AnyLocals): Promise<Treatment[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const where = onlyPublished ? "WHERE published = 1 AND active = 1" : "";
  const { results } = await env.db
    .prepare(`SELECT * FROM treatments ${where} ORDER BY display_order ASC`)
    .all<any>();
  return (results ?? []).map(rowToTreatment);
}

export async function getTeam(locals?: AnyLocals): Promise<TeamMember[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db
    .prepare("SELECT * FROM team WHERE published = 1 ORDER BY display_order ASC")
    .all<any>();
  return (results ?? []).map(rowToTeam);
}

export async function getGallery(locals?: AnyLocals): Promise<GalleryItem[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db
    .prepare("SELECT * FROM gallery WHERE published = 1 ORDER BY featured DESC, display_order ASC")
    .all<any>();
  return (results ?? []).map(rowToGallery);
}

export async function getBeforeAfter(locals?: AnyLocals): Promise<BeforeAfterCase[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db
    .prepare(`SELECT * FROM before_after
              WHERE published = 1 AND approval = 'approved' AND consent = 1
              ORDER BY display_order ASC`)
    .all<any>();
  return (results ?? []).map(rowToBeforeAfter);
}

/**
 * Before/After cases linked to ONE treatment, matched by the case's
 * `treatment_name` against the treatment's name (case-insensitive, trimmed —
 * the Studio labels the field so admins type the exact treatment name).
 * Same visibility rules as getBeforeAfter: published + approved + consented.
 */
export async function getBeforeAfterForTreatment(treatmentName: string, locals?: AnyLocals): Promise<BeforeAfterCase[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db
    .prepare(`SELECT * FROM before_after
              WHERE published = 1 AND approval = 'approved' AND consent = 1
                AND LOWER(TRIM(treatment_name)) = LOWER(TRIM(?))
              ORDER BY display_order ASC`)
    .bind(treatmentName)
    .all<any>();
  return (results ?? []).map(rowToBeforeAfter);
}

export async function getTestimonials(locals?: AnyLocals): Promise<Testimonial[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db
    .prepare(`SELECT * FROM testimonials
              WHERE published = 1 AND approved = 1
              ORDER BY featured DESC, COALESCE(display_order, 0) ASC`)
    .all<any>();
  return (results ?? []).map(rowToTestimonial);
}

export async function getArticles(onlyPublished = true, locals?: AnyLocals): Promise<Article[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const where = onlyPublished ? "WHERE published = 1" : "";
  const { results } = await env.db
    .prepare(`SELECT * FROM articles ${where} ORDER BY featured DESC, published_date DESC`)
    .all<any>();
  return (results ?? []).map(rowToArticle);
}

export async function getFaqs(locals?: AnyLocals): Promise<Faq[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const { results } = await env.db
    .prepare("SELECT * FROM faqs WHERE published = 1 ORDER BY display_order ASC")
    .all<any>();
  return (results ?? []).map(rowToFaq);
}

// ---------- Admin CRUD ------------------------------------------------------

function tableFor(key: CollectionKey): string {
  // Map collection keys to actual table names. We keep this in one place to
  // avoid string drift across the file.
  switch (key) {
    case "site": return "site";
    case "hero": return "hero";
    case "contact": return "contact";
    case "treatments": return "treatments";
    case "articles": return "articles";
    case "team": return "team";
    case "gallery": return "gallery";
    case "beforeAfter": return "before_after";
    case "testimonials": return "testimonials";
    case "announcements": return "announcements";
    case "offers": return "offers";
    case "hours": return "hours";
    case "specialHours": return "special_hours";
    case "faqs": return "faqs";
    case "social": return "social";
  }
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function listAll(key: CollectionKey, locals?: AnyLocals): Promise<any[]> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const tbl = tableFor(key);
  const { results } = await env.db.prepare(`SELECT * FROM ${tbl} ORDER BY display_order ASC, id ASC`).all<any>();
  return results ?? [];
}

/**
 * Replace the single row for `key` (site/hero/contact) with a merged object.
 * The studio PUT/POST for SINGLE collections funnels through here.
 */
export async function upsertSingle(key: CollectionKey, body: Record<string, any>, locals?: AnyLocals): Promise<any> {
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  if (key === "site") {
    await env.db.prepare(
      `INSERT INTO site (id,name,short_name,tagline,location,country,description,brand_primary,brand_accent,logo_text)
       VALUES ('site',?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, short_name=excluded.short_name, tagline=excluded.tagline,
         location=excluded.location, country=excluded.country, description=excluded.description,
         brand_primary=excluded.brand_primary, brand_accent=excluded.brand_accent, logo_text=excluded.logo_text`
    ).bind(
      body.name, body.shortName, body.tagline, body.location, body.country,
      body.description, body.brandColors?.primary ?? "#003C80",
      body.brandColors?.accent ?? "#b08d57", body.logoText
    ).run();
    return getSite(locals);
  }
  if (key === "hero") {
    await env.db.prepare(
      `INSERT INTO hero (id,eyebrow,headline,headline_accent,subhead,primary_cta_label,secondary_cta_label,whatsapp_label,status_note,image,image_mobile)
       VALUES ('hero',?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         eyebrow=excluded.eyebrow, headline=excluded.headline, headline_accent=excluded.headline_accent,
         subhead=excluded.subhead, primary_cta_label=excluded.primary_cta_label, secondary_cta_label=excluded.secondary_cta_label,
         whatsapp_label=excluded.whatsapp_label, status_note=excluded.status_note,
         image=excluded.image, image_mobile=excluded.image_mobile`
    ).bind(
      body.eyebrow, body.headline, body.headlineAccent, body.subhead,
      body.primaryCtaLabel, body.secondaryCtaLabel, body.whatsappLabel,
      body.statusNote, JSON.stringify(body.image ?? { src: "", alt: "", focalX: 50, focalY: 50 }),
      body.imageMobile ? JSON.stringify(body.imageMobile) : null
    ).run();
    return getHero(locals);
  }
  if (key === "contact") {
    await env.db.prepare(
      `INSERT INTO contact (id,phone,whatsapp,email,maps_url,address_verified,address_note)
       VALUES ('contact',?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         phone=excluded.phone, whatsapp=excluded.whatsapp, email=excluded.email,
         maps_url=excluded.maps_url, address_verified=excluded.address_verified, address_note=excluded.address_note`
    ).bind(
      body.phone, body.whatsapp, body.email ?? "",
      body.mapsUrl, body.addressVerified, body.addressNote
    ).run();
    return getContact(locals);
  }
  throw new Error(`upsertSingle called for non-single collection: ${key}`);
}

export async function createItem(key: CollectionKey, body: Record<string, any>, locals?: AnyLocals): Promise<any> {
  if (SINGLE.has(key)) return upsertSingle(key, body, locals);
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const id = body.id || newId();
  const now = new Date().toISOString();
  const tbl = tableFor(key);
  // Each array collection has its own column shape; build the INSERT
  // dynamically from the rowToX helpers to keep the schema mapping single-source.
  const row = buildRow(key, body, id, now, /*isInsert*/ true);
  const cols = Object.keys(row);
  const placeholders = cols.map(() => "?").join(",");
  await env.db.prepare(
    `INSERT INTO ${tbl} (${cols.join(",")}) VALUES (${placeholders})`
  ).bind(...cols.map((c) => row[c])).run();
  return { id, ...body };
}

export async function updateItem(key: CollectionKey, id: string, body: Record<string, any>, locals?: AnyLocals): Promise<any | undefined> {
  if (SINGLE.has(key)) return upsertSingle(key, body, locals);
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const tbl = tableFor(key);
  const now = new Date().toISOString();
  const row = buildRow(key, body, id, now, /*isInsert*/ false);
  const setClause = Object.keys(row).filter((c) => c !== "id").map((c) => `${c} = ?`).join(", ");
  const params = Object.keys(row).filter((c) => c !== "id").map((c) => row[c]);
  const res = await env.db.prepare(`UPDATE ${tbl} SET ${setClause} WHERE id = ?`).bind(...params, id).run();
  if (!res.meta || (res.meta.changes ?? 0) === 0) return undefined;
  return { id, ...body, updatedAt: now };
}

export async function deleteItem(key: CollectionKey, id: string, locals?: AnyLocals): Promise<boolean> {
  if (SINGLE.has(key)) return false;
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const tbl = tableFor(key);
  const res = await env.db.prepare(`DELETE FROM ${tbl} WHERE id = ?`).bind(id).run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * Swap `display_order` with the previous or next sibling.
 *
 * Done inside a transaction so two concurrent reorders from different admins
 * can't drop or duplicate items. (Best-effort: Cloudflare D1 doesn't expose
 * explicit BEGIN/COMMIT through the D1 HTTP API — the prepare/batch API does
 * run statements sequentially.)
 */
export async function reorderItem(key: CollectionKey, id: string, dir: "up" | "down", locals?: AnyLocals): Promise<boolean> {
  if (SINGLE.has(key)) return false;
  const env = envOf(locals as any);
  if (!env.db) throw new Error("D1 not available");
  const tbl = tableFor(key);

  const rows = await env.db
    .prepare(`SELECT id, display_order FROM ${tbl} ORDER BY display_order ASC, id ASC`)
    .all<any>();
  const list: { id: string; display_order: number }[] = rows.results ?? [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return false;

  const a = list[idx].display_order ?? idx;
  const b = list[swap].display_order ?? swap;
  // Update both rows. D1's .batch executes the statements sequentially within
  // a single worker turn — concurrent reorders from a second Worker are still
  // possible but a single admin doesn't lose work.
  await env.db.batch([
    env.db.prepare(`UPDATE ${tbl} SET display_order = ? WHERE id = ?`).bind(b, list[idx].id),
    env.db.prepare(`UPDATE ${tbl} SET display_order = ? WHERE id = ?`).bind(a, list[swap].id),
  ]);
  return true;
}

/**
 * Map the public collection body to the raw D1 row shape.
 * This is the single source of truth for column names so we don't drift from
 * the schema.
 */
function buildRow(key: CollectionKey, body: Record<string, any>, id: string, now: string, isInsert: boolean): Record<string, any> {
  const out: Record<string, any> = { id };
  switch (key) {
    case "treatments": {
      out.slug = body.slug ?? "";
      out.name = body.name ?? "";
      out.category = body.category ?? "";
      out.short_description = body.shortDescription ?? "";
      out.long_description = body.longDescription ?? "";
      out.icon = body.icon ?? "";
      out.duration = body.duration ?? "";
      out.price = body.price ?? "";
      out.price_visible = body.priceVisible ? 1 : 0;
      out.faqs = JSON.stringify(body.faqs ?? []);
      out.image = JSON.stringify(body.image ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.seo_title = body.seoTitle ?? "";
      out.seo_description = body.seoDescription ?? "";
      out.featured = body.featured ? 1 : 0;
      out.active = body.active === false ? 0 : 1;
      out.published = body.published === false ? 0 : 1;
      out.display_order = body.displayOrder ?? 0;
      out.created_at = isInsert ? now : (body.createdAt ?? now);
      out.updated_at = now;
      break;
    }
    case "articles": {
      out.slug = body.slug ?? "";
      out.title = body.title ?? "";
      out.excerpt = body.excerpt ?? "";
      out.body = body.body ?? "";
      out.author = body.author ?? "";
      out.category = body.category ?? "";
      out.tags = JSON.stringify(body.tags ?? []);
      out.published_date = body.publishedDate ?? "";
      out.updated_date = body.updatedDate ?? "";
      out.seo_title = body.seoTitle ?? "";
      out.seo_description = body.seoDescription ?? "";
      out.featured_image = JSON.stringify(body.featuredImage ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.social_image = JSON.stringify(body.socialImage ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.featured = body.featured ? 1 : 0;
      out.published = body.published === false ? 0 : 1;
      out.display_order = body.displayOrder ?? 0;
      out.created_at = isInsert ? now : (body.createdAt ?? now);
      out.updated_at = now;
      break;
    }
    case "team": {
      out.name = body.name ?? "";
      out.role = body.role ?? "";
      out.photo = JSON.stringify(body.photo ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.biography = body.biography ?? "";
      out.specialties = JSON.stringify(body.specialties ?? []);
      out.credentials = body.credentials ?? "";
      out.display_order = body.displayOrder ?? 0;
      out.published = body.published === false ? 0 : 1;
      break;
    }
    case "gallery": {
      out.title = body.title ?? "";
      out.category = body.category ?? "";
      out.description = body.description ?? "";
      out.image = JSON.stringify(body.image ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.alt = body.alt ?? "";
      out.date = body.date ?? "";
      out.featured = body.featured ? 1 : 0;
      out.published = body.published === false ? 0 : 1;
      out.display_order = body.displayOrder ?? 0;
      break;
    }
    case "beforeAfter": {
      out.treatment_name = body.treatmentName ?? "";
      out.description = body.description ?? "";
      out.duration = body.duration ?? "";
      out.before_image = JSON.stringify(body.beforeImage ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.after_image = JSON.stringify(body.afterImage ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.consent = body.consent ? 1 : 0;
      out.approval = body.approval ?? "draft";
      out.published = body.published ? 1 : 0;
      out.display_order = body.displayOrder ?? 0;
      break;
    }
    case "testimonials": {
      out.display_name = body.displayName ?? "";
      out.quote = body.quote ?? "";
      out.rating = body.rating ?? 5;
      out.date = body.date ?? "";
      out.is_demo = body.isDemo ? 1 : 0;
      out.approved = body.approved ? 1 : 0;
      out.featured = body.featured ? 1 : 0;
      out.published = body.published ? 1 : 0;
      out.display_order = body.displayOrder ?? null;
      break;
    }
    case "announcements": {
      out.title = body.title ?? "";
      out.message = body.message ?? "";
      out.cta_label = body.ctaLabel ?? "";
      out.cta_url = body.ctaUrl ?? "";
      out.start_date = body.startDate ?? "";
      out.end_date = body.endDate ?? "";
      out.priority = body.priority ?? "normal";
      out.published = body.published === false ? 0 : 1;
      out.style = body.style ?? "bar";
      break;
    }
    case "offers": {
      out.title = body.title ?? "";
      out.description = body.description ?? "";
      out.image = JSON.stringify(body.image ?? { src: "", alt: "", focalX: 50, focalY: 50 });
      out.valid_from = body.validFrom ?? "";
      out.valid_until = body.validUntil ?? "";
      out.cta_label = body.ctaLabel ?? "";
      out.whatsapp_message = body.whatsappMessage ?? "";
      out.active = body.active === false ? 0 : 1;
      out.featured = body.featured ? 1 : 0;
      break;
    }
    case "hours": {
      out.day = body.day ?? "";
      out.label = body.label ?? "";
      out.closed = body.closed ? 1 : 0;
      out.open = body.open ?? "";
      out.close = body.close ?? "";
      out.open2 = body.open2 ?? "";
      out.close2 = body.close2 ?? "";
      break;
    }
    case "specialHours": {
      out.label = body.label ?? "";
      out.date = body.date ?? "";
      out.closed = body.closed ? 1 : 0;
      out.open = body.open ?? "";
      out.close = body.close ?? "";
      out.note = body.note ?? "";
      break;
    }
    case "faqs": {
      out.question = body.question ?? "";
      out.answer = body.answer ?? "";
      out.display_order = body.displayOrder ?? 0;
      out.published = body.published === false ? 0 : 1;
      break;
    }
    case "social": {
      out.label = body.label ?? "";
      out.url = body.url ?? "";
      out.display_order = body.displayOrder ?? 0;
      out.published = body.published === false ? 0 : 1;
      break;
    }
  }
  return out;
}
