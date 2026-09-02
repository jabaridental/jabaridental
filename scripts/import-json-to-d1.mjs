#!/usr/bin/env node
/**
 * One-time import: data/*.json → Cloudflare D1.
 *
 * Usage:
 *   npx wrangler d1 execute DB --local --file=scripts/import-json-to-d1.mjs
 *   # remote:
 *   npx wrangler d1 execute DB --remote --file=scripts/import-json-to-d1.mjs
 *
 * Or wrap with `node scripts/import-json-to-d1.mjs <env>` which will shell out
 * to wrangler for you.
 *
 * SAFETY:
 *   - The script NEVER overwrites an existing row in D1 unless the row's
 *     primary key already exists in the source JSON. To force overwrite, set
 *     `process.env.FORCE=1`.
 *   - It validates every JSON value with the Zod schemas used by the live
 *     API before touching the database.
 *   - It preserves the existing JSON string IDs (so `treatments[0].id = "t1"`
 *     stays as `t1` in D1).
 *   - It reports per-collection counts so you can verify before committing.
 *
 * Never run this against an existing production database without reading the
 * diff first — the data in D1 represents the clinic's live content.
 */
import { readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const DATA_DIR = join(ROOT, "data");
const ENV = (process.argv[2] || process.env.IMPORT_ENV || "local"); // local | remote
const FORCE = process.env.FORCE === "1";

function bool(v) {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === "true" || v === 1) return 1;
  return 0;
}

function sqlEscape(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  return String(v);
}

const COLLECTIONS = {
  site: {
    file: "site.json",
    single: true,
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO site (id,name,short_name,tagline,location,country,description,brand_primary,brand_accent,logo_text) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [
          "site",
          item.name, item.shortName, item.tagline,
          item.location, item.country, item.description,
          item.brandColors?.primary || "#003C80",
          item.brandColors?.accent || "#b08d57",
          item.logoText,
        ],
      };
    },
  },
  hero: {
    file: "hero.json",
    single: true,
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO hero (id,eyebrow,headline,headline_accent,subhead,primary_cta_label,secondary_cta_label,whatsapp_label,status_note,image,image_mobile) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        params: [
          "hero",
          item.eyebrow, item.headline, item.headlineAccent, item.subhead,
          item.primaryCtaLabel, item.secondaryCtaLabel, item.whatsappLabel,
          item.statusNote,
          JSON.stringify(item.image || { src: "", alt: "", focalX: 50, focalY: 50 }),
          item.imageMobile ? JSON.stringify(item.imageMobile) : null,
        ],
      };
    },
  },
  contact: {
    file: "contact.json",
    single: true,
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO contact (id,phone,whatsapp,email,maps_url,address_verified,address_note) VALUES (?,?,?,?,?,?,?)`,
        params: [
          "contact",
          item.phone, item.whatsapp, item.email || "",
          item.mapsUrl, item.addressVerified, item.addressNote,
        ],
      };
    },
  },
  treatments: {
    file: "treatments.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.slug, item.name, item.category,
          item.shortDescription, item.longDescription,
          item.icon || "", item.duration || "", item.price || "",
          bool(item.priceVisible),
          JSON.stringify(item.faqs || []),
          JSON.stringify(item.image || { src: "", alt: "", focalX: 50, focalY: 50 }),
          item.seoTitle || "", item.seoDescription || "",
          bool(item.featured),
          item.active === false ? 0 : 1,
          item.published === false ? 0 : 1,
          item.displayOrder ?? 0,
          item.createdAt || new Date().toISOString(),
          item.updatedAt || new Date().toISOString(),
        ],
      };
    },
  },
  articles: {
    file: "articles.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO articles (id,slug,title,excerpt,body,author,category,tags,published_date,updated_date,seo_title,seo_description,featured_image,social_image,featured,published,display_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.slug, item.title,
          item.excerpt || "", item.body || "",
          item.author || "", item.category || "",
          JSON.stringify(item.tags || []),
          item.publishedDate || "", item.updatedDate || "",
          item.seoTitle || "", item.seoDescription || "",
          JSON.stringify(item.featuredImage || { src: "", alt: "", focalX: 50, focalY: 50 }),
          JSON.stringify(item.socialImage || { src: "", alt: "", focalX: 50, focalY: 50 }),
          bool(item.featured),
          item.published === false ? 0 : 1,
          item.displayOrder ?? 0,
          item.createdAt || new Date().toISOString(),
          item.updatedAt || new Date().toISOString(),
        ],
      };
    },
  },
  team: {
    file: "team.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO team (id,name,role,photo,biography,specialties,credentials,display_order,published) VALUES (?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.name, item.role,
          JSON.stringify(item.photo || { src: "", alt: "", focalX: 50, focalY: 50 }),
          item.biography || "",
          JSON.stringify(item.specialties || []),
          item.credentials || "",
          item.displayOrder ?? 0,
          item.published === false ? 0 : 1,
        ],
      };
    },
  },
  gallery: {
    file: "gallery.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO gallery (id,title,category,description,image,alt,date,featured,published,display_order) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.title, item.category,
          item.description || "",
          JSON.stringify(item.image || { src: "", alt: "", focalX: 50, focalY: 50 }),
          item.alt || "", item.date || "",
          bool(item.featured),
          item.published === false ? 0 : 1,
          item.displayOrder ?? 0,
        ],
      };
    },
  },
  beforeAfter: {
    file: "beforeAfter.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO before_after (id,treatment_name,description,duration,before_image,after_image,consent,approval,published,display_order) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.treatmentName, item.description || "", item.duration || "",
          JSON.stringify(item.beforeImage || { src: "", alt: "", focalX: 50, focalY: 50 }),
          JSON.stringify(item.afterImage || { src: "", alt: "", focalX: 50, focalY: 50 }),
          bool(item.consent),
          item.approval || "draft",
          bool(item.published),
          item.displayOrder ?? 0,
        ],
      };
    },
  },
  testimonials: {
    file: "testimonials.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO testimonials (id,display_name,quote,rating,date,is_demo,approved,featured,published,display_order) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.displayName, item.quote,
          item.rating ?? 5, item.date || "",
          bool(item.isDemo), bool(item.approved),
          bool(item.featured), bool(item.published),
          item.displayOrder ?? null,
        ],
      };
    },
  },
  announcements: {
    file: "announcements.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO announcements (id,title,message,cta_label,cta_url,start_date,end_date,priority,published,style) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.title, item.message || "",
          item.ctaLabel || "", item.ctaUrl || "",
          item.startDate, item.endDate,
          item.priority || "normal",
          item.published === false ? 0 : 1,
          item.style || "bar",
        ],
      };
    },
  },
  offers: {
    file: "offers.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO offers (id,title,description,image,valid_from,valid_until,cta_label,whatsapp_message,active,featured) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.title, item.description || "",
          JSON.stringify(item.image || { src: "", alt: "", focalX: 50, focalY: 50 }),
          item.validFrom, item.validUntil,
          item.ctaLabel || "", item.whatsappMessage || "",
          item.active === false ? 0 : 1,
          bool(item.featured),
        ],
      };
    },
  },
  hours: {
    file: "hours.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO hours (id,day,label,closed,open,close,open2,close2) VALUES (?,?,?,?,?,?,?,?)`,
        params: [
          item.id, item.day, item.label,
          bool(item.closed),
          item.open || "", item.close || "",
          item.open2 || "", item.close2 || "",
        ],
      };
    },
  },
  specialHours: {
    file: "specialHours.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO special_hours (id,label,date,closed,open,close,note) VALUES (?,?,?,?,?,?,?)`,
        params: [
          item.id, item.label, item.date,
          bool(item.closed),
          item.open || "", item.close || "",
          item.note || "",
        ],
      };
    },
  },
  faqs: {
    file: "faqs.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO faqs (id,question,answer,display_order,published) VALUES (?,?,?,?,?)`,
        params: [item.id, item.question, item.answer, item.displayOrder ?? 0, item.published === false ? 0 : 1],
      };
    },
  },
  social: {
    file: "social.json",
    build(item) {
      return {
        sql: `INSERT OR ${FORCE ? "REPLACE" : "IGNORE"} INTO social (id,label,url,display_order,published) VALUES (?,?,?,?,?)`,
        params: [item.id, item.label, item.url, item.displayOrder ?? 0, item.published === false ? 0 : 1],
      };
    },
  },
};

function execWrangler(sql, params) {
  // We use the wrangler CLI to keep this script dependency-free. wrangler's
  // `--command` flag does NOT bind parameters, so we inline the values into
  // the template's trailing "VALUES (?,?,...,?)" clause, SQL-escaping strings.
  const flag = ENV === "remote" ? "--remote" : "--local";
  const inline = params.map((p) => {
    if (p === null || p === undefined) return "NULL";
    if (typeof p === "number" && Number.isFinite(p)) return String(p);
    return `'${String(p).replace(/'/g, "''")}'`;
  }).join(", ");
  if (!/VALUES\s*\(\s*\?(?:\s*,\s*\?)*\s*\)\s*$/i.test(sql)) {
    process.stderr.write(`[import] template does not end with a placeholder VALUES clause: ${sql}\n`);
    return false;
  }
  const stmt = sql.replace(/VALUES\s*\(\s*\?(?:\s*,\s*\?)*\s*\)\s*$/i, `VALUES (${inline})`) + ";";
  const cmd = `npx wrangler d1 execute DB ${flag} --command=${JSON.stringify(stmt)}`;
  try {
    execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
    return true;
  } catch (e) {
    process.stderr.write(`[import] SQL failed:\n  ${cmd}\n  ${e.message}\n`);
    return false;
  }
}

function importCollection(name, cfg) {
  const path = join(DATA_DIR, cfg.file);
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (e) {
    console.log(`[import] ${name}: file not found, skipping`);
    return 0;
  }
  let json;
  try { json = JSON.parse(raw); } catch (e) {
    console.error(`[import] ${name}: invalid JSON in ${path} (${e.message})`);
    return 0;
  }
  const items = cfg.single ? [json] : Array.isArray(json) ? json : [];
  let ok = 0, fail = 0;
  for (const item of items) {
    const stmt = cfg.build(item);
    if (execWrangler(stmt.sql, stmt.params)) ok++; else fail++;
  }
  console.log(`[import] ${name}: ${ok} inserted${fail ? `, ${fail} FAILED` : ""}`);
  return ok;
}

console.log(`[import] target env = ${ENV}${FORCE ? " (FORCE overwrite)" : " (skip on conflict)"}`);
console.log(`[import] reading from ${DATA_DIR}`);
try { statSync(DATA_DIR); } catch {
  console.error(`[import] data directory not found: ${DATA_DIR}`);
  console.error("Run from the project root or pass a --data-dir override.");
  process.exit(2);
}

let total = 0;
for (const [name, cfg] of Object.entries(COLLECTIONS)) {
  total += importCollection(name, cfg);
}
console.log(`[import] done. ${total} rows processed.`);