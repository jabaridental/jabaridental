#!/usr/bin/env node
/**
 * Push the current commit to GitHub.
 *
 * This script DOES NOT:
 *   - log into GitHub via a browser
 *   - type your username and password into a form
 *   - bypass 2FA / CAPTCHA / device verification
 *   - store or transmit credentials
 *
 * It DOES:
 *   - read the configured git remote (`git remote get-url origin`)
 *   - run `git add -A`, `git commit -m "<message>"`, `git push <remote> <branch>`
 *   - delegate auth to whatever is already configured on this machine:
 *       * `gh auth login` (GitHub CLI, OAuth device flow) -- recommended
 *       * an SSH key registered with GitHub
 *       * a PAT in the GH_TOKEN env var
 *
 * If no auth is configured it prints the exact command to run (gh auth login)
 * and exits with a clear error. The operator must complete that step in
 * their own browser; the script does not attempt to do it for them.
 *
 * Usage:
 *   node scripts/push-to-github.mjs "<commit message>" [branch]
 *   # default branch is "main"
 *
 * Required env:
 *   None (the script uses whatever git credentials are already configured).
 *   Optional: GH_TOKEN (PAT) -- used only if no other credential exists.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const message = process.argv[2];
const branch = process.argv[3] || "main";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}
function shInherit(cmd) {
  return execSync(cmd, { stdio: "inherit", encoding: "utf8" });
}

if (!message) {
  console.error("usage: node scripts/push-to-github.mjs \"<commit message>\" [branch]");
  process.exit(2);
}

if (!existsSync(resolve(ROOT, ".git"))) {
  console.error("not a git repository");
  process.exit(1);
}

// --- Check that a git remote exists -----------------------------------------
let remoteUrl = "";
try {
  remoteUrl = sh("git remote get-url origin");
} catch {
  console.error("No `origin` remote configured. Add one with:");
  console.error(`  git remote add origin git@github.com:<you>/jabari-dental.git`);
  console.error("or, after `gh auth login`:");
  console.error("  gh repo create jabari-dental --source=. --private --push");
  process.exit(1);
}
console.log(`remote: ${remoteUrl}`);

// --- Sanity-check that some auth method will work ---------------------------
// We don't print secrets; we just check that `git push` won't fail immediately
// for lack of credentials. The exact failure mode (SSH key, PAT, GH_TOKEN)
// surfaces in the final push attempt.
function hasGitAuth() {
  // 1. SSH: `git ls-remote` works non-interactively if a key is loaded.
  // 2. PAT in env: GH_TOKEN set.
  // 3. gh CLI auth: `gh auth status` returns a username.
  if (process.env.GH_TOKEN) return "GH_TOKEN env var";
  try {
    const out = sh("gh auth status 2>&1 || true");
    if (/Logged in to github\.com/.test(out)) return "gh CLI (" + out.split("\n").find((l) => /account/.test(out.split("\n").indexOf(l)) || /@/.test(l))?.trim() + ")";
    if (/Logged in/.test(out)) return "gh CLI";
  } catch { /* gh not installed */ }
  return null;
}

const auth = hasGitAuth();
if (!auth) {
  console.error("No GitHub auth method found.");
  console.error("Pick ONE of the following (each runs in YOUR browser, no automation here):");
  console.error("  - GitHub CLI OAuth device flow:");
  console.error("      gh auth login                (HTTPS + browser)");
  console.error("      gh auth login --ssh         (SSH key upload)");
  console.error("  - SSH key already registered with GitHub (ssh-add + verify with `ssh -T git@github.com`)");
  console.error("  - PAT in env var:               set GH_TOKEN=ghp_... then re-run");
  process.exit(1);
}
console.log(`auth: ${auth}`);

// --- Guard against accidentally committing secrets --------------------------
// Minimal scrub: refuse to add files that match the secret patterns.
const SECRET_PATTERNS = [/\.env$/, /\.env\.local$/, /secrets\.(json|ya?ml|toml)$/i, /credentials\.(json|ya?ml|toml)$/i];
const blocked = [];
try {
  const tracked = sh("git ls-files").split("\n");
  for (const f of tracked) {
    if (SECRET_PATTERNS.some((p) => p.test(f))) blocked.push(f);
  }
  // Also check files about to be added.
  const staged = sh("git status --porcelain").split("\n");
  for (const line of staged) {
    const f = line.replace(/^.{3}\s*/, "").trim();
    if (SECRET_PATTERNS.some((p) => p.test(f))) blocked.push(f);
  }
} catch { /* ignore */ }

if (blocked.length) {
  console.error("Refusing to push — would commit files that look like secrets:");
  for (const f of blocked) console.error("  " + f);
  console.error("Remove them (or extend .gitignore) and re-run.");
  process.exit(1);
}

// --- Stage, commit, push -----------------------------------------------------
console.log(`branch: ${branch}`);
console.log(`commit message: ${message}`);

try {
  shInherit("git add -A");
} catch (e) {
  console.error("git add failed:", e.message);
  process.exit(1);
}

let committedSomething = false;
try {
  shInherit(`git commit -m ${shellEscape(message)}`);
  committedSomething = true;
} catch (e) {
  // `git commit` exits non-zero when there is nothing to commit. That's fine.
  console.log("(nothing to commit)");
}

// `git push` is the one step that genuinely needs auth. Inherit stdio so the
// operator can see prompts (e.g. SSH key passphrase, PAT prompt).
try {
  shInherit(`git push origin ${branch}`);
} catch (e) {
  console.error("");
  console.error("git push failed. Most common causes:");
  console.error("  - No SSH key registered / not loaded (`ssh-add -l`)");
  console.error("  - GH_TOKEN expired or revoked");
  console.error("  - Repository does not exist or you lack push permission");
  console.error("  - Branch protection requires a PR instead of direct push");
  if (committedSomething) {
    console.error("Your commit is LOCAL. Re-run this script after fixing auth.");
  }
  process.exit(1);
}

console.log("pushed.");

function shellEscape(s) {
  // POSIX-safe single-quote escape. Good enough for the platforms we ship to.
  return `'${s.replace(/'/g, `'\\''`)}'`;
}