// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const SITE = "https://jabaridental.com";

// Build target for Cloudflare Pages.
// Deploy with: npm run build:cf && wrangler pages deploy dist
export default defineConfig({
  site: SITE,
  output: "server",
  adapter: cloudflare(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/studio") &&
        !page.includes("/api/") &&
        !page.includes("/404"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  dev: {
    port: 4321,
  },
  build: {
    inlineStylesheets: "auto",
  },
});
