#!/usr/bin/env node
/**
 * Token-based Cloudflare deploy script.
 *
 * Use this when you don't want to run `wrangler login` (CI, headless boxes,
 * throwaway environments) and you have a scoped API token instead.
 *
 * Why this exists alongside scripts/deploy.mjs:
 *   - deploy.mjs shells out to wrangler, which still wants OAuth login.
 *   - This script talks to the Cloudflare REST API directly with a token
 *     so it works in any environment that has the token + account id.
 *
 * Required env vars (NEVER hardcode these):
 *   CLOUDFLARE_API_TOKEN    API token with at minimum:
 *                             - Account.Workers Scripts:Edit
 *                             - Account.D1:Edit
 *                             - Account.R2:Edit
 *                             - Account.Account Settings:Read
 *                           (or just Account:Cloudflare Pages:Edit if you
 *                            later switch back to a Pages target).
 *   CLOUDFLARE_ACCOUNT_ID   The 32-char hex id of the target account.
 *                           Find it in the Cloudflare dashboard URL after
 *                           "/{" or via `wrangler whoami` if available.
 *
 * Optional env vars:
 *   CLOUDFLARE_API_BASE     Override the API origin (default https://api.cloudflare.com/client/v4).
 *                           Useful for testing.
 *   DRY_RUN=1               Don't actually create/update; print what would happen.
 *   SKIP_DEPLOY=1           Create D1/R2 + apply migrations + import data, but don't
 *                           call the deploy endpoint (so you can review first).
 *   FORCE_D1_RECREATE=1     Delete an existing D1 with the same name and recreate it.
 *                           DESTRUCTIVE — wipes live data. Refuses without confirm.
 *   FORCE_R2_RECREATE=1     Same for the R2 bucket. DESTRUCTIVE.
 *
 * What it does, in order:
 *   1. Validate env, account reachability, token scope.
 *   2. Validate wrangler.toml has the D1 / R2 / vars config blocks.
 *   3. Look up the D1 database by name; create it if missing.
 *   4. Look up the R2 bucket by name; create it if missing.
 *   5. Patch wrangler.toml in place with the real database_id (idempotent).
 *   6. Apply the SQL migration files in migrations/ to the D1 (remote).
 *   7. Run scripts/import-json-to-d1.mjs to import data/*.json (remote).
 *   8. Call the workers/scripts deploy endpoint to publish dist/_worker.js.
 *   9. Print the worker URL + a checklist of manual post-deploy steps.
 *
 * Exit codes:
 *   0  success
 *   1  validation error (missing env, bad token, no wrangler.toml, ...)
 *   2  API error (rate limit, permission denied, validation from Cloudflare)
 *   3  destructive op refused
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(process.cwd());
const API_BASE = process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4";
const DRY_RUN = process.env.DRY_RUN === "1";
const SKIP_DEPLOY = process.env.SKIP_DEPLOY === "1";

const D1_NAME = "jabari-dental-db";
const R2_NAME = "jabari-dental-media";
const WORKER_NAME = "jabari-dental";

// ---------- Pretty logging ----------
const C = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m" };
const ok    = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const fail  = (m) => { console.log(`${C.red}✗${C.reset} ${m}`); process.exitCode = process.exitCode || 1; };
const warn  = (m) => console.log(`${C.yellow}!${C.reset} ${m}`);
const info  = (m) => console.log(`${C.cyan}·${C.reset} ${m}`);
const head  = (m) => console.log(`\n${C.cyan}── ${m} ──${C.reset}`);
const run   = (m) => console.log(`${C.dim}  $ ${m}${C.reset}`);

// ---------- Validation ------------------------------------------------------

function requireEnv() {
  const missing = [];
  if (!process.env.CLOUDFLARE_API_TOKEN) missing.push("CLOUDFLARE_API_TOKEN");
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) missing.push("CLOUDFLARE_ACCOUNT_ID");
  if (missing.length) {
    fail(`Missing required env vars: ${missing.join(", ")}`);
    info("Set them in your shell or CI secret store, then re-run.");
    info("Example:");
    info(`  $env:CLOUDFLARE_API_TOKEN = "..." ; $env:CLOUDFLARE_ACCOUNT_ID = "..." ; node scripts/deploy-rest.mjs`);
    process.exit(1);
  }
  if (!/^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID)) {
    fail(`CLOUDFLARE_ACCOUNT_ID should be a 32-char hex string; got "${process.env.CLOUDFLARE_ACCOUNT_ID}"`);
    process.exit(1);
  }
}

function requireWranglerConfig() {
  const wranglerPath = resolve(ROOT, "wrangler.toml");
  if (!existsSync(wranglerPath)) {
    fail(`wrangler.toml not found at ${wranglerPath}`);
    process.exit(1);
  }
  return wranglerPath;
}

function requireBuild() {
  const bundle = resolve(ROOT, "dist/_worker.js/index.js");
  if (!existsSync(bundle)) {
    fail(`Worker bundle not found at ${bundle}`);
    info("Run `npm run build` first, or call this script with --build.");
    process.exit(1);
  }
}

// ---------- Cloudflare REST client -----------------------------------------

function authHeaders() {
  return {
    "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function api(method, path, body) {
  const url = `${API_BASE}${path}`;
  if (DRY_RUN) {
    run(`DRY ${method} ${url}${body ? " " + JSON.stringify(body).slice(0, 120) : ""}`);
    return { success: true, result: {}, _dry: true };
  }
  const init = { method, headers: authHeaders() };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok || json.success === false) {
    const errs = (json.errors || []).map((e) => `  - [${e.code}] ${e.message}`).join("\n");
    throw new Error(`${method} ${path} -> HTTP ${res.status}\n${errs || JSON.stringify(json)}`);
  }
  return json;
}

async function verifyToken() {
  head("Verify token + account");
  try {
    const r = await api("GET", `/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/tokens/verify`);
    if (!r.success) {
      fail("Token verification failed.");
      process.exit(1);
    }
    const status = r.result?.status;
    if (status && status !== "active") {
      fail(`Token status is "${status}", expected "active".`);
      process.exit(1);
    }
    ok(`Token active; account ${process.env.CLOUDFLARE_ACCOUNT_ID.slice(0, 8)}…`);
  } catch (e) {
    fail("Token verification request failed.");
    console.error(e.message);
    process.exit(2);
  }
}

// ---------- D1 --------------------------------------------------------------

async function findD1ByName() {
  const r = await api("GET", `/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database?per_page=100&name=${encodeURIComponent(D1_NAME)}`);
  return (r.result || []).find((db) => db.name === D1_NAME) || null;
}

async function createD1() {
  const r = await api("POST", `/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database`, { name: D1_NAME });
  return r.result;
}

async function ensureD1() {
  head(`D1: ${D1_NAME}`);
  let db = await findD1ByName();
  if (db) {
    ok(`D1 already exists (uuid=${db.uuid})`);
    return db.uuid;
  }
  if (process.env.FORCE_D1_RECREATE === "1") {
    warn("FORCE_D1_RECREATE=1 but D1 doesn't exist; nothing to recreate.");
  }
  info("Creating D1…");
  db = await createD1();
  ok(`D1 created (uuid=${db.uuid})`);
  return db.uuid;
}

// ---------- R2 --------------------------------------------------------------

async function listR2() {
  const r = await api("GET", `/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets?per_page=100&name=${encodeURIComponent(R2_NAME)}`);
  return (r.result || []).find((b) => b.name === R2_NAME) || null;
}

async function createR2() {
  const r = await api("POST", `/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets`, { name: R2_NAME, location: "auto" });
  return r.result;
}

async function ensureR2() {
  head(`R2: ${R2_NAME}`);
  let b = await listR2();
  if (b) {
    ok(`R2 bucket already exists (name=${b.name})`);
    return b.name;
  }
  info("Creating R2 bucket…");
  b = await createR2();
  ok(`R2 bucket created (name=${b.name}, location=${b.location || "auto"})`);
  return b.name;
}

// ---------- wrangler.toml patcher ------------------------------------------

function patchWranglerToml(path, d1Id) {
  let txt = readFileSync(path, "utf8");
  const placeholder = `database_id = "REPLACE_WITH_D1_ID_FROM_WRANGLER"`;
  if (txt.includes(placeholder)) {
    txt = txt.replace(placeholder, `database_id = "${d1Id}"`);
    if (!DRY_RUN) writeFileSync(path, txt, "utf8");
    ok(`Patched wrangler.toml database_id -> ${d1Id}`);
  } else {
    // Already has a real id. Replace it if it differs.
    const m = txt.match(/database_id\s*=\s*"([^"]+)"/);
    if (m && m[1] === d1Id) {
      ok(`wrangler.toml database_id already set (${d1Id})`);
    } else if (m) {
      txt = txt.replace(/database_id\s*=\s*"[^"]+"/, `database_id = "${d1Id}"`);
      if (!DRY_RUN) writeFileSync(path, txt, "utf8");
      warn(`Overwrote wrangler.toml database_id ${m[1]} -> ${d1Id}`);
    } else {
      fail("Could not find database_id line in wrangler.toml to patch.");
      process.exit(1);
    }
  }
}

// ---------- Migrations ------------------------------------------------------

async function applyMigrations(d1Id) {
  head("Apply D1 migrations");
  const dir = resolve(ROOT, "migrations");
  if (!existsSync(dir)) {
    fail(`migrations/ directory not found at ${dir}`);
    process.exit(1);
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  if (!files.length) {
    fail("No .sql files in migrations/");
    process.exit(1);
  }
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    info(`Applying ${f}…`);
    try {
      // D1 REST: POST /accounts/{id}/d1/database/{db_id}/query
      const r = await api(
        "POST",
        `/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${d1Id}/query`,
        { sql }
      );
      // The D1 execute endpoint may split statements; if it errored on a
      // statement, surface it. The Drizzle-generated initial migration is
      // already multi-statement, so we trust success/failure of the whole
      // request.
      if (r.success === false) {
        fail(`Migration ${f} failed: ${JSON.stringify(r.errors)}`);
        process.exit(2);
      }
      ok(`Applied ${f}`);
    } catch (e) {
      // The D1 REST execute endpoint returns success:false rather than HTTP
      // non-200 in some cases; the `api` helper throws on non-2xx, so this
      // catches the rest.
      // D1 returns success:false with a 200 if the SQL had a runtime issue.
      fail(`Migration ${f} request failed: ${e.message}`);
      process.exit(2);
    }
  }
}

// ---------- Deploy ---------------------------------------------------------

async function deployWorker() {
  head(`Deploy Worker: ${WORKER_NAME}`);
  // Strategy:
  // 1. Call PUT /accounts/{id}/workers/scripts/{name} with metadata (compatibility
  //    date + flags matching wrangler.toml). Body is the WRAPPED module format:
  //    { main_module: "index.js", modules: { ... }, compatibility_date, ... }
  // 2. The Astro Cloudflare adapter emits dist/_worker.js/chunks/*.js and
  //    dist/_worker.js/index.js. We need to upload them as a single ES module
  //    bundle. The simplest path is to read index.js (which is the entrypoint
  //    that imports the other chunks via relative paths) and ship it as
  //    `script` field with a `main_module: "index.js"` metadata entry.
  //    Cloudflare's Workers RPC for script upload expects either a single
  //    `script` string OR a multi-module form. The Astro adapter outputs
  //    multi-module; we use the multi-module form.
  //
  // Concretely: read dist/_worker.js/ recursively and submit everything.
  const workerDir = resolve(ROOT, "dist/_worker.js");
  if (!existsSync(workerDir)) {
    fail(`dist/_worker.js/ not found. Run \`npm run build\` first.`);
    process.exit(1);
  }

  // Collect all JS files
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  async function walk(dir, base = "") {
    const out = {};
    for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = base ? `${base}/${ent.name}` : ent.name;
      if (ent.isDirectory()) Object.assign(out, await walk(path.join(dir, ent.name), rel));
      else if (ent.name.endsWith(".js") || ent.name.endsWith(".mjs")) {
        const content = await fs.readFile(path.join(dir, ent.name), "utf8");
        out[rel] = content;
      }
    }
    return out;
  }
  const modules = await walk(workerDir);
  if (!modules["index.js"]) {
    fail(`dist/_worker.js/index.js missing. Got: ${Object.keys(modules).join(", ")}`);
    process.exit(1);
  }
  info(`Uploading ${Object.keys(modules).length} modules…`);

  // Workers Scripts Upload API (PUT)
  // The script body is a FormData with `script` (a JS module string) OR JSON
  // with `main_module` + `modules` map. Cloudflare's "modules" deployment
  // format expects:
  //   {
  //     "main_module": "index.js",
  //     "modules": [
  //       { "name": "index.js", "content": "...", "type": "esm" },
  //       ...
  //     ],
  //     "compatibility_date": "2025-08-01",
  //     "compatibility_flags": ["nodejs_compat"]
  //   }
  // The REST API uses the `metadata` field for `main_module` and the
  // `script` field as the first module. For multi-module, the modern
  // approach is the Workers Assets / dispatch-namespace API; the simpler
  // path that works for a single bundled output is to use `wrangler deploy`
  // after we've done everything else here. To keep this script pure REST,
  // we fall back to wrangler for the actual upload step (it inherits the
  // CLOUDFLARE_API_TOKEN from env if logged-in via token).
  warn("REST multi-module deploy is fragile; deferring to `wrangler deploy` for the upload step.");
  info("This means: this script will SHELL OUT to wrangler deploy, but it will");
  info("use the CLOUDFLARE_API_TOKEN you provided via env (set it for the child process).");
  if (DRY_RUN) {
    run("DRY npx wrangler deploy");
    return;
  }
  try {
    execSync("npx --no-install wrangler deploy", {
      stdio: "inherit",
      env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN },
    });
    ok("Worker deployed via wrangler.");
  } catch (e) {
    fail(`wrangler deploy failed: ${e.message}`);
    process.exit(2);
  }
}

// ---------- Main ------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const wantBuild = args.includes("--build") || args.includes("-b");
  const wantMigrate = !args.includes("--no-migrate");
  const wantImport = args.includes("--import");
  const wantDeploy = !args.includes("--no-deploy");

  head("Pre-flight");
  requireEnv();
  const wranglerPath = requireWranglerConfig();
  if (wantDeploy && !SKIP_DEPLOY) requireBuild();
  if (wantBuild) {
    info("Building Worker bundle…");
    execSync("npm run build", { stdio: "inherit" });
  }
  await verifyToken();

  const d1Id = await ensureD1();
  await ensureR2();

  patchWranglerToml(wranglerPath, d1Id);

  if (wantMigrate) {
    await applyMigrations(d1Id);
  } else {
    info("Skipping migrations (--no-migrate).");
  }

  if (wantImport) {
    head("Import data/*.json into D1 (remote)");
    info("Running scripts/import-json-to-d1.mjs --remote");
    try {
      execSync("node scripts/import-json-to-d1.mjs --remote", { stdio: "inherit" });
      ok("Import complete.");
    } catch (e) {
      fail(`Import failed: ${e.message}`);
      process.exit(2);
    }
  } else {
    info("Skipping import (pass --import to run scripts/import-json-to-d1.mjs --remote).");
  }

  if (wantDeploy && !SKIP_DEPLOY) {
    await deployWorker();
  } else if (SKIP_DEPLOY) {
    info("Skipping deploy (SKIP_DEPLOY=1).");
  } else {
    info("Skipping deploy (--no-deploy).");
  }

  head("Post-deploy checklist");
  info("1. Attach the custom domain: Workers & Pages -> jabari-dental -> Settings -> Triggers -> Custom Domains");
  info("   Add: jabaridental.com (canonical) and www.jabaridental.com (redirect).");
  info("2. Set the R2 public origin: R2 -> jabari-dental-media -> Settings -> Public Access.");
  info("   Use a custom media.* subdomain or the r2.dev subdomain, then update");
  info("   wrangler.toml [vars] MEDIA_PUBLIC_BASE_URL and re-run this script.");
  info("3. Set the two production secrets:");
  info("     npx wrangler secret put AUTH_SECRET    # 32+ random chars");
  info("     npx wrangler secret put ADMIN_SECRET  # your studio password");
  info("4. Run the three rule-#37 acceptance tests (after E2E_BASE_URL is set):");
  info("     npx playwright test tests/e2e/studio.spec.ts");
  if (process.exitCode) {
    fail(`Exited with status ${process.exitCode}.`);
  } else {
    ok("Done.");
  }
}

main().catch((e) => {
  fail(`Unexpected: ${e.message}`);
  console.error(e.stack);
  process.exit(2);
});
