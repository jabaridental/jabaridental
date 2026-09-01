// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const SITE = "https://jabaridental.com";

/**
 * Production target: Cloudflare Workers.
 *
 * The Worker reads D1 (env.DB) and R2 (env.MEDIA_BUCKET) from wrangler.toml.
 * Local development should use `wrangler dev` (or `npm run dev:cf`) so the
 * same bindings are exposed; `astro dev` alone will surface a clear
 * "D1 binding missing" error if a getter is called.
 *
 * Hard rule: refuse to build without AUTH_SECRET and ADMIN_SECRET present in
 * the build environment — otherwise the studio would accept any login (the
 * dev fallback secret is public). Both are wired through wrangler.toml +
 * `wrangler secret put` for production, and through env vars for local builds.
 *
 * Build: `npm run build:cf`
 * Deploy: `wrangler deploy` (NOT `wrangler pages deploy` — we are a Worker,
 * not a Pages project, since we need D1/R2 bindings via wrangler.toml).
 */
const REQUIRED = ["AUTH_SECRET", "ADMIN_SECRET"];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(
      `\n  Refusing Cloudflare build: ${k} is not set.\n` +
        `  Set it via:\n` +
        `    - wrangler secret put ${k}   (production)\n` +
        `    - export ${k}=...            (local)\n`
    );
    process.exit(1);
  }
  const v = process.env[k] || "";
  if (k === "AUTH_SECRET" && v.length < 32) {
    console.error(`\n  Refusing Cloudflare build: AUTH_SECRET is shorter than 32 characters.\n`);
    process.exit(1);
  }
}

export default defineConfig({
  site: SITE,
  output: "server",
  adapter: cloudflare({
    // imageService: 'cloudflare' would serve images through Cloudflare Images
    // — we don't use it because our images live in R2 and are addressed via
    // the public hostname.
  }),
  security: {
    checkOrigin: true,
    allowedDomains: [
      { hostname: "jabaridental.com" },
      { hostname: "www.jabaridental.com" },
      { hostname: "localhost" },
      // Allow Cloudflare preview URLs during initial deploys so the team can
      // verify a deployment before the custom domain is attached.
      { hostname: "*.workers.dev" },
    ],
  },
  prefetch: {
    defaultStrategy: "hover",
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/studio") &&
        !page.includes("/api/") &&
        !page.includes("/404"),
      customPages: ["https://jabaridental.com/sitemap-content.xml"],
    }),
  ],
  vite: {
    // @tailwindcss/vite's plugin types are nominally compatible but TypeScript
    // narrows the hoisted Vite version to a different Plugin<any> identity than
    // the one Astro's bundled Vite exports. The plugin works at runtime — this
    // is purely a TS-narrowing quirk across dual Vite copies.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
  server: {
    port: 4321,
  },
  build: {
    inlineStylesheets: "auto",
  },
});