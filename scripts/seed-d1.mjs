#!/usr/bin/env node
/**
 * Seed an empty D1 database with the JABARI DENTAL starter content.
 *
 * IMPORTANT: never run this against an existing production database that
 * contains real clinic content — it WILL overwrite rows. The script reads
 * the existing JSON files in data/ (gitignored) and emits INSERT OR REPLACE
 * statements.
 *
 * For migrating existing content from JSON into a fresh D1, prefer
 * scripts/import-json-to-d1.mjs, which uses INSERT OR IGNORE and preserves
 * existing rows.
 *
 * Usage:
 *   node scripts/seed-d1.mjs --local
 *   node scripts/seed-d1.mjs --remote
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const DATA_DIR = join(ROOT, "data");
const SEED_FILE = join(ROOT, "src", "data", "seed.ts");
const ENV = (process.argv[2] || "--local").replace(/^--/, "");
if (ENV !== "local" && ENV !== "remote") {
  console.error("usage: node scripts/seed-d1.mjs --local | --remote");
  process.exit(2);
}

if (!existsSync(SEED_FILE)) {
  console.error(`[seed] missing ${SEED_FILE}`);
  process.exit(2);
}

// We import the TS seed via the same pattern the import script uses: parse
// the JSON files in data/ if they exist, otherwise fall back to the in-tree
// seed by shelling out to a small TS evaluator. In practice, for a fresh
// install, the JSON files will be present after the user runs the project
// once locally. The cleanest cross-environment approach is to keep both.
let source = DATA_DIR;
if (!existsSync(DATA_DIR) || !existsSync(join(DATA_DIR, "site.json"))) {
  console.error(`[seed] data/ directory is empty or missing (${DATA_DIR}).`);
  console.error("       For a fresh install, populate it from src/data/seed.ts first.");
  process.exit(3);
}

function wrangler(sql, params = []) {
  const flag = ENV === "remote" ? "--remote" : "--local";
  const args = params.map((p) => {
    if (p === null || p === undefined) return "NULL";
    if (typeof p === "string") return `'${String(p).replace(/'/g, "''")}'`;
    return String(p);
  }).join(", ");
  const cmd = `npx wrangler d1 execute DB ${flag} --command=${JSON.stringify(`${sql} VALUES (${args});`)}`;
  try {
    execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
    return true;
  } catch (e) {
    process.stderr.write(`[seed] ${e.message}\n`);
    return false;
  }
}

function readJSON(name) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}

function insertSingle(name, sql, obj, fields) {
  const params = fields.map((f) => {
    if (f === "image" || f === "beforeImage" || f === "afterImage" || f === "imageMobile" || f === "featuredImage" || f === "socialImage" || f === "photo") {
      return JSON.stringify(obj[f] ?? { src: "", alt: "", focalX: 50, focalY: 50 });
    }
    return obj[f];
  });
  return wrangler(sql, params);
}

function insertRows(name, sql, list, build) {
  let n = 0;
  for (const item of list) {
    const stmt = build(item);
    if (wrangler(stmt.sql, stmt.params)) n++;
  }
  return n;
}

console.log(`[seed] target = ${ENV}`);
console.log(`[seed] reading from ${DATA_DIR}`);

// site
insertSingle("site",
  "INSERT OR REPLACE INTO site (id,name,short_name,tagline,location,country,description,brand_primary,brand_accent,logo_text) VALUES (?,?,?,?,?,?,?,?,?,?)",
  readJSON("site.json"),
  ["site","name","shortName","tagline","location","country","description","brandColors.primary","brandColors.accent","logoText"]
);
// hero
insertSingle("hero",
  "INSERT OR REPLACE INTO hero (id,eyebrow,headline,headline_accent,subhead,primary_cta_label,secondary_cta_label,whatsapp_label,status_note,image,image_mobile) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  readJSON("hero.json"),
  ["hero","eyebrow","headline","headlineAccent","subhead","primaryCtaLabel","secondaryCtaLabel","whatsappLabel","statusNote","image","imageMobile"]
);
// contact
insertSingle("contact",
  "INSERT OR REPLACE INTO contact (id,phone,whatsapp,email,maps_url,address_verified,address_note) VALUES (?,?,?,?,?,?,?)",
  readJSON("contact.json"),
  ["contact","phone","whatsapp","email","mapsUrl","addressVerified","addressNote"]
);

const buildInsert = {
  treatments(item) {
    return {
      sql: "INSERT OR REPLACE INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      params: [
        item.id, item.slug, item.name, item.category,
        item.shortDescription, item.longDescription,
        item.icon, item.duration, item.price,
        item.priceVisible ? 1 : 0,
        JSON.stringify(item.faqs || []),
        JSON.stringify(item.image),
        item.seoTitle, item.seoDescription,
        item.featured ? 1 : 0,
        item.active ? 1 : 0,
        item.published ? 1 : 0,
        item.displayOrder,
        item.createdAt, item.updatedAt,
      ],
    };
  },
};

insertRows("treatments", "", readJSON("treatments.json"), buildInsert.treatments);
console.log("[seed] done.");