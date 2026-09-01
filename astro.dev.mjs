// @ts-check
/**
 * OPTIONAL local-only dev config.
 *
 * The production target is astro.cloudflare.mjs (Cloudflare Worker + D1 + R2).
 * This file is a convenience for working on the frontend without wrangler — it
 * uses @astrojs/node and is NOT used for builds or deploys.
 *
 * It requires `@astrojs/node` which is intentionally NOT in package.json so
 * Cloudflare-only deploys don't pull in Node-only deps. To use this config:
 *
 *   npm install --save-dev @astrojs/node
 *   npx astro dev --config astro.dev.mjs
 */
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

const SITE = "https://jabaridental.com";

export default defineConfig({
  site: SITE,
  output: "server",
  security: {
    checkOrigin: true,
    allowedDomains: [
      { hostname: "jabaridental.com" },
      { hostname: "www.jabaridental.com" },
      { hostname: "localhost" },
      { hostname: "127.0.0.1" },
    ],
  },
  prefetch: { defaultStrategy: "hover" },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/studio") &&
        !page.includes("/api/") &&
        !page.includes("/404"),
      customPages: ["https://jabaridental.com/sitemap-content.xml"],
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  server: { port: 4321 },
  build: { inlineStylesheets: "auto" },
});
