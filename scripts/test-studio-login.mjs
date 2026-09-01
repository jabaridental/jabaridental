import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Never hardcode the admin password. Read it from the environment, falling back
// to the local .env file so `node scripts/test-studio-login.mjs` still just works.
function readEnvFile(key) {
  try {
    const raw = readFileSync(resolve(__dirname, "..", ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env */
  }
  return undefined;
}

const URL = process.env.STUDIO_URL || "http://localhost:4321/studio/login";
const PASSWORD = process.env.ADMIN_SECRET || readEnvFile("ADMIN_SECRET");

if (!PASSWORD) {
  console.log("SKIP  \u2192 no ADMIN_SECRET in the environment or .env; nothing to test against.");
  process.exit(0);
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

try {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click('button[type="submit"]'),
  ]);

  // Give the client-side handler / redirect a moment.
  await page.waitForTimeout(800);

  const finalUrl = page.url();
  const errorVisible = await page
    .locator("[data-error]")
    .evaluate((el) => !el.classList.contains("hidden") && el.textContent.trim().length > 0)
    .catch(() => false);
  const errorText = errorVisible
    ? (await page.locator("[data-error]").textContent())?.trim()
    : "";

  if (finalUrl.includes("/studio") && !finalUrl.includes("/login")) {
    console.log("PASS  \u2192 login succeeded, navigated to:", finalUrl);
  } else if (errorVisible) {
    console.log("FAIL  \u2192 login rejected:", errorText || "Incorrect password");
  } else {
    console.log("FAIL  \u2192 unexpected state at", finalUrl);
  }
} catch (e) {
  console.log("ERROR \u2192", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
