#!/usr/bin/env node
/**
 * Write dist/.assetsignore so `wrangler deploy` (used by CI Workers Builds)
 * does NOT upload dist/_worker.js/ as a public static asset.
 *
 * @astrojs/cloudflare v12 emits the SSR Worker bundle into dist/_worker.js/ and
 * client assets directly into dist/. With `[assets] directory = "./dist"`,
 * wrangler walks the whole dist/ tree and refuses to upload _worker.js because
 * doing so would expose the server-side code. The documented fix is an
 * .assetsignore file containing `_worker.js`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
mkdirSync(distDir, { recursive: true });
writeFileSync(resolve(distDir, ".assetsignore"), "_worker.js\n", "utf8");
console.log("[build] dist/.assetsignore written (_worker.js excluded from static assets)");