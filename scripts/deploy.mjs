#!/usr/bin/env node
/**
 * Operator-run deployment script.
 *
 * What this script IS:
 *   - A wrapper around the 9 manual wrangler / wrangler-secret commands from
 *     the deployment runbook.
 *   - A preflight checker: it verifies Node version, wrangler installation,
 *     auth status, and that D1 / R2 resources exist before running any
 *     mutating command.
 *   - A single entry point so the operator can run "node scripts/deploy.mjs"
 *     and see every step in sequence with clear pass/fail output.
 *
 * What this script IS NOT:
 *   - It does NOT automate GitHub login or any GitHub web flow.
 *   - It does NOT automate Cloudflare login. If wrangler is unauthenticated,
 *     it prints the exact `wrangler login` command and exits.
 *   - It does NOT solve CAPTCHAs, bypass Turnstile, or scrape session cookies.
 *     Those flows require a human in a real browser.
 *
 * Modes:
 *   node scripts/deploy.mjs preflight    -- check prerequisites only
 *   node scripts/deploy.mjs full        -- preflight + everything
 *   node scripts/deploy.mjs deploy      -- build + wrangler deploy only (safe to re-run)
 *
 * Exit codes: 0 success, non-zero on any failure. Errors are recoverable; the
 * script never makes a destructive change without printing what it's about to
 * do and waiting on `wrangler`'s own prompts.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const MODE = (process.argv[2] || "full").toLowerCase();

// ---------- Pretty logging ----------
const C = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m" };
const ok    = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const fail  = (m) => console.log(`${C.red}✗${C.reset} ${m}`);
const warn  = (m) => console.log(`${C.yellow}!${C.reset} ${m}`);
const info  = (m) => console.log(`${C.cyan}·${C.reset} ${m}`);
const head  = (m) => console.log(`\n${C.cyan}── ${m} ──${C.reset}`);
const run   = (m) => console.log(`${C.dim}  $ ${m}${C.reset}`);

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...opts });
}

function shInteractive(cmd, label) {
  // Use spawnSync so the child process inherits stdio for wrangler's own prompts.
  info(`running: ${label}`);
  run(cmd);
  const r = spawnSync(cmd, { stdio: "inherit", shell: true, encoding: "utf8" });
  if (r.status !== 0) {
    fail(`${label} exited with status ${r.status}`);
    process.exit(r.status || 1);
  }
}

function requireNode(minMajor) {
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major < minMajor) {
    fail(`Node ${process.versions.node} detected. Astro 5 + Wrangler 4 need Node >= ${minMajor}.`);
    process.exit(1);
  }
  ok(`Node ${process.versions.node}`);
}

function requireWrangler() {
  try {
    sh("npx --no-install wrangler --version");
    ok("wrangler available");
  } catch {
    fail("wrangler is not installed. Run `npm install` first.");
    process.exit(1);
  }
}

function requireWranglerAuth() {
  try {
    const out = sh("npx --no-install wrangler whoami").trim();
    if (!out || out.includes("not authenticated") || out.includes("You are not")) {
      fail("wrangler is installed but not authenticated.");
      info("Run this in your terminal: npx wrangler login");
      info("Then re-run this script.");
      process.exit(1);
    }
    // Take the first line of `wrangler whoami` output as the account label.
    const account = out.split("\n")[0].replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "").trim();
    ok(`authenticated as ${account}`);
  } catch (e) {
    fail("could not run `wrangler whoami`");
    console.error(e.message);
    process.exit(1);
  }
}

function requireWranglerConfig() {
  const wranglerPath = resolve(ROOT, "wrangler.toml");
  if (!existsSync(wranglerPath)) {
    fail(`wrangler.toml not found at ${wranglerPath}`);
    process.exit(1);
  }
  ok("wrangler.toml present");
}

function d1Exists() {
  // `wrangler d1 list` is the canonical check. If the database id is the
  // placeholder we wrote earlier, this still returns "exists" but with the
  // wrong id -- we catch that separately below.
  try {
    const out = sh("npx --no-install wrangler d1 list 2>&1 || true");
    return out.includes("jabari-dental-db");
  } catch {
    return false;
  }
}

function d1IdValid() {
  // Heuristic: if wrangler.toml's database_id is the placeholder, refuse.
  const txt = require("node:fs").readFileSync(resolve(ROOT, "wrangler.toml"), "utf8");
  return !/database_id\s*=\s*"REPLACE_WITH_D1_ID_FROM_WRANGLER"/.test(txt);
}

function r2Exists() {
  try {
    const out = sh("npx --no-install wrangler r2 bucket list 2>&1 || true");
    return out.includes("jabari-dental-media");
  } catch {
    return false;
  }
}

function secretsSet() {
  // `wrangler secret list` requires auth + project linkage. If it errors we
  // assume the operator hasn't created the Worker yet; the deploy step will
  // surface a clear error if a secret is missing.
  try {
    sh("npx --no-install wrangler secret list 2>&1 || true");
    return true;
  } catch {
    return false;
  }
}

function preflight() {
  head("Preflight");
  requireNode(20);
  requireWrangler();
  requireWranglerAuth();
  requireWranglerConfig();

  if (!d1Exists()) {
    fail("D1 database `jabari-dental-db` not found in your account.");
    info("Create it with: npx wrangler d1 create jabari-dental-db");
    info("Then paste the returned id into wrangler.toml `database_id = \"...\"`");
    process.exit(1);
  }
  ok("D1 database exists");

  if (!d1IdValid()) {
    fail("wrangler.toml `database_id` is still the placeholder.");
    info("Paste the real id from `npx wrangler d1 create jabari-dental-db` output.");
    process.exit(1);
  }
  ok("wrangler.toml database_id set");

  if (!r2Exists()) {
    fail("R2 bucket `jabari-dental-media` not found.");
    info("Create it with: npx wrangler r2 bucket create jabari-dental-media");
    process.exit(1);
  }
  ok("R2 bucket exists");

  info("(Reminder) AUTH_SECRET and ADMIN_SECRET are set via:");
  info("    npx wrangler secret put AUTH_SECRET");
  info("    npx wrangler secret put ADMIN_SECRET");
  info("This script does not verify them because wrangler hides secret values.");
}

function buildWorker() {
  head("Build");
  // The Cloudflare config guard will exit 1 if AUTH_SECRET / ADMIN_SECRET
  // are not in process.env. We pass them through from the wrangler-secret
  // preview only when available locally; production deploys get them from
  // the Cloudflare dashboard instead.
  const env = { ...process.env };
  shInteractive("npm run build", "astro build (Cloudflare target)");
  ok("Worker bundle at dist/_worker.js/");
}

function d1Migrate() {
  head("D1 migrations");
  shInteractive("npx wrangler d1 migrations apply DB --remote", "apply migrations to remote D1");
  ok("D1 schema applied");
}

function importOrSeed() {
  head("Content import");
  // Prefer the one-time importer (preserves JSON ids, INSERT OR IGNORE).
  // Falls back to seeder if no JSON files are present (fresh install).
  info("If you have data/*.json from the previous filesystem setup, this is the moment to import.");
  info("If the database is fresh and you want demo content, this is the moment to seed.");
  const choice = process.env.DEPLOY_CHOICE || "import";
  if (choice === "seed") {
    shInteractive("node scripts/seed-d1.mjs --remote", "seed D1 from src/data/seed.ts");
  } else {
    shInteractive("node scripts/import-json-to-d1.mjs --remote", "import data/*.json into D1");
  }
  ok("Content loaded");
}

function deploy() {
  head("Deploy");
  shInteractive("npx wrangler deploy", "wrangler deploy");
  ok("Worker deployed");
}

function postDeployHints() {
  head("Post-deploy");
  info("After deploy, attach the custom domain via the Cloudflare dashboard:");
  info("  Workers & Pages -> jabari-dental -> Settings -> Triggers -> Custom Domains");
  info("  Add: jabaridental.com (canonical) and www.jabaridental.com (redirect)");
  info("");
  info("Set the R2 public hostname:");
  info("  R2 -> jabari-dental-media -> Settings -> Public Access");
  info("  Either use a custom media.* subdomain or the r2.dev subdomain.");
  info("  Then update wrangler.toml [vars] MEDIA_PUBLIC_BASE_URL and redeploy.");
  info("");
  info("Run the three critical acceptance tests (rule #37 of the brief):");
  info("  1. Login -> edit hero -> upload image -> verify public -> redeploy -> re-verify");
  info("  2. Add article -> verify sitemap + URL -> redeploy -> re-verify");
  info("  3. Upload gallery image -> verify public -> redeploy -> re-verify");
  info("");
  info("Playwright suite (after setting E2E_BASE_URL=https://jabaridental.com):");
  info("  npx playwright test tests/e2e/");
}

if (MODE === "preflight") {
  preflight();
  ok("preflight complete");
} else if (MODE === "deploy") {
  preflight();
  buildWorker();
  deploy();
  postDeployHints();
} else if (MODE === "full") {
  preflight();
  buildWorker();
  d1Migrate();
  importOrSeed();
  deploy();
  postDeployHints();
} else {
  console.error(`Unknown mode: ${MODE}`);
  console.error("Usage: node scripts/deploy.mjs [preflight|full|deploy]");
  process.exit(2);
}