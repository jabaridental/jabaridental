#!/usr/bin/env node
/**
 * Seed a D1 database with the FULL JABARI DENTAL starter content — all 15
 * collections (site, hero, contact, social, hours, specialHours,
 * announcements, offers, treatments, team, gallery, beforeAfter,
 * testimonials, articles, faqs).
 *
 * The previous seeder only wrote site/hero/contact/treatments and passed
 * dotted paths ("brandColors.primary") straight to the DB as NULL — which is
 * why "some of the seed data" never appeared after deploying. This version:
 *
 *   1. Loads the in-tree seed from src/data/seed.ts (transpiled with esbuild,
 *      already installed as an Astro/Vite dependency — no new packages).
 *   2. Writes the content to data/*.json so there are editable JSON sources
 *      for `npm run import:json`.
 *   3. Generates ONE SQL file (INSERT OR REPLACE for every collection) and
 *      executes it with a single `wrangler d1 execute DB --file=...` call
 *      (the old script spawned one wrangler process per row).
 *
 * WARNING: INSERT OR REPLACE overwrites rows with the same id. Never run this
 * against a production database that already contains real clinic content you
 * want to keep. For a safe merge that preserves existing rows, use
 * `npm run import:json` (INSERT OR IGNORE) instead.
 *
 * Usage:
 *   node scripts/seed-d1.mjs --local
 *   node scripts/seed-d1.mjs --remote
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";
import { COLLECTIONS, setEnv, setForce, stmtToSql } from "./import-json-to-d1.mjs";

const ROOT = resolve(process.cwd());
const SEED_FILE = join(ROOT, "src", "data", "seed.ts");
const DATA_DIR = join(ROOT, "data");
const SQL_FILE = join(ROOT, ".seed-d1.tmp.sql");
const ENV = (process.argv[2] || "--local").replace(/^--/, "");
if (ENV !== "local" && ENV !== "remote") {
  console.error("usage: node scripts/seed-d1.mjs --local | --remote");
  process.exit(2);
}

/** Load SEED from the TypeScript source (esbuild strips the type-only import). */
async function loadSeed() {
  const src = readFileSync(SEED_FILE, "utf8");
  const { code } = esbuild.transformSync(src, { loader: "ts", format: "esm" });
  const tmp = join(ROOT, ".seed-src.tmp.mjs");
  writeFileSync(tmp, code, "utf8");
  try {
    const mod = await import(pathToFileURL(tmp).href);
    return mod.SEED;
  } finally {
    rmSync(tmp, { force: true });
  }
}

setEnv(ENV);
setForce(true); // a seeder intentionally overwrites its own ids (OR REPLACE)

const SEED = await loadSeed();
if (!SEED || !SEED.site) {
  console.error(`[seed] could not load SEED from ${SEED_FILE}`);
  process.exit(3);
}

// 1) Write the data/*.json sources (same filenames the import script reads).
mkdirSync(DATA_DIR, { recursive: true });
for (const [name, cfg] of Object.entries(COLLECTIONS)) {
  const value = SEED[name];
  if (value === undefined) {
    console.warn(`[seed] warning: SEED.${name} is missing — skipped`);
    continue;
  }
  writeFileSync(join(DATA_DIR, cfg.file), JSON.stringify(value, null, 2) + "\n", "utf8");
}
console.log(`[seed] wrote JSON sources to ${DATA_DIR}`);

// 2) Build one SQL file covering every collection.
const statements = [];
const counts = {};
for (const [name, cfg] of Object.entries(COLLECTIONS)) {
  const value = SEED[name];
  if (value === undefined) continue;
  const items = cfg.single ? [value] : (Array.isArray(value) ? value : []);
  for (const item of items) statements.push(stmtToSql(cfg.build(item)));
  counts[name] = items.length;
}
if (statements.length === 0) {
  console.error("[seed] nothing to seed — SEED produced no statements");
  process.exit(3);
}
writeFileSync(SQL_FILE, statements.join("\n") + "\n", "utf8");

// 3) Execute in a single wrangler call (-y skips the remote-apply prompt).
const flag = ENV === "remote" ? "--remote" : "--local";
console.log(`[seed] executing ${statements.length} statements against the ${ENV} D1 database...`);
try {
  execSync(`npx wrangler d1 execute DB ${flag} --file=${JSON.stringify(SQL_FILE)} -y`, { stdio: "inherit" });
} finally {
  rmSync(SQL_FILE, { force: true });
}

for (const [name, n] of Object.entries(counts)) console.log(`[seed]   ${name}: ${n} row(s)`);
console.log("[seed] done.");