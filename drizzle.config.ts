import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit config for Cloudflare D1 migrations.
 *
 * D1 is SQLite-compatible, so we point Drizzle Kit at a local SQLite file for
 * migration generation (`--local` style). The generated SQL is dialect-neutral
 * DDL and is applied to D1 with `wrangler d1 migrations apply DB`.
 *
 * Run:
 *   npm run db:generate           # produces migrations/0000_*.sql from schema.ts
 *   npm run db:migrate:local      # applies to local wrangler D1
 *   npm run db:migrate:remote     # applies to the production D1
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  // Drizzle Kit's d1-http driver talks to wrangler's local D1 over HTTP for
  // generation. For production migrations use `wrangler d1 migrations apply`.
  dbCredentials: {
    url: "http://localhost:8787",
    // Account ID is required only when using the REST driver against remote
    // D1. For local generation the wrangler dev server handles auth.
  },
  verbose: true,
  strict: true,
} satisfies Config;