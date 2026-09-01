# JABARI DENTAL

Premium dental-clinic website + admin CMS, running on Cloudflare Workers + D1 + R2.

- **Frontend:** Astro 5 (SSR), Tailwind v4, TypeScript
- **Data:** Cloudflare D1 (SQLite at the edge)
- **Media:** Cloudflare R2
- **Auth:** HMAC-SHA256 session cookie, brute-force protected, single-admin
- **PWA:** service worker, manifest, offline page
- **SEO:** sitemaps (static + dynamic), JSON-LD `Dentist` schema, RSS, robots.txt, security.txt

The production target is **Cloudflare Workers only**. There is no Node standalone path.

---

## Local development

```bash
npm install
cp .env.example .env   # only if you want local secrets; the build reads them from env
```

For frontend iteration with fake data:

```bash
npm install --save-dev @astrojs/node
npm run dev          # uses astro.config.mjs (Node adapter, in-memory store)
```

For full-stack local work that exercises the real Cloudflare bindings:

```bash
# One-time setup of local D1 + R2
npx wrangler d1 create jabari-dental-db --local
npx wrangler r2 bucket create jabari-dental-media

# Local migrations + seed
npm run db:migrate:local
npm run db:seed:local      # only if data/*.json is present locally

# Run wrangler dev (in a second terminal)
npm run dev:cf             # exposes the same bindings as production
```

---

## Production deployment

There are two paths. Use the **token path** in CI / headless environments; use the **wrangler path** when you have an interactive shell with `wrangler login`.

### Path A — token-based (no browser, no `wrangler login`)

```bash
# 0. One-time: create a scoped API token at
#    https://dash.cloudflare.com/profile/api-tokens
#    Permissions required:
#      - Account > Workers Scripts: Edit
#      - Account > D1: Edit
#      - Account > R2: Edit
#      - Account > Account Settings: Read
#    Find your account id at https://dash.cloudflare.com (it's in the URL).

# 1. Export them for this shell (PowerShell shown; bash equivalent: export ...)
$env:CLOUDFLARE_API_TOKEN  = "..."
$env:CLOUDFLARE_ACCOUNT_ID = "3f741aa105bcbe71a5173a52be5251ef"  # 32-char hex

# 2. Build the Worker bundle (also requires AUTH_SECRET + ADMIN_SECRET — see .env.example)
$env:AUTH_SECRET  = (New-Guid).Guid + (New-Guid).Guid            # 32+ random chars
$env:ADMIN_SECRET = "your-studio-password"
npm run build

# 3. One-shot: create D1, create R2, patch wrangler.toml, apply migrations,
#    import data/*.json, deploy the Worker.
node scripts/deploy-rest.mjs --import
```

`deploy-rest.mjs` accepts flags:

| Flag | Effect |
|---|---|
| `--build` / `-b` | Build the Worker bundle before deploying |
| `--import` | Run `scripts/import-json-to-d1.mjs --remote` after migrations |
| `--no-migrate` | Skip the migration apply step |
| `--no-deploy` | Stop after migrations + import |
| env `DRY_RUN=1` | Print every API call without making it |
| env `SKIP_DEPLOY=1` | Same as `--no-deploy` |
| env `FORCE_D1_RECREATE=1` | DESTRUCTIVE — wipe + recreate D1 |
| env `FORCE_R2_RECREATE=1` | DESTRUCTIVE — wipe + recreate R2 |

### Path B — interactive wrangler (fallback)

```bash
# 0. Verify prerequisites
node scripts/deploy.mjs preflight

# 1. Log into Cloudflare
npx wrangler login

# 2. Create the D1 database
npx wrangler d1 create jabari-dental-db
# Paste the returned database_id into wrangler.toml

# 3. Create the R2 bucket
npx wrangler r2 bucket create jabari-dental-media

# 4. Apply D1 migrations
npm run db:migrate:remote

# 5. One-time data import (only if you have data/*.json from the filesystem era)
npm run import:json --remote
# or, for a fresh database with demo content:
# npm run db:seed:remote

# 6. Set the two production secrets
npx wrangler secret put AUTH_SECRET    # 32+ random chars
npx wrangler secret put ADMIN_SECRET  # your studio password

# 7. Build + deploy
npm run build
npx wrangler deploy

# 8. Attach the custom domain via the Cloudflare dashboard
#    Workers & Pages -> jabari-dental -> Settings -> Triggers -> Custom Domains
#    Add: jabaridental.com (canonical) and www.jabaridental.com (redirect)

# 9. Configure the R2 public origin
#    R2 -> jabari-dental-media -> Settings -> Public Access
#    Either a custom media.* subdomain (recommended) or the r2.dev subdomain.
#    Then update wrangler.toml [vars] MEDIA_PUBLIC_BASE_URL and re-deploy.
```

### GitHub CI

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.

Required repo variables/secrets:

| Type | Name | Value |
|------|------|-------|
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| Variable | `CLOUDFLARE_DATABASE_ID` | D1 database id from `wrangler d1 create` |
| Variable | `E2E_BASE_URL` | `https://jabaridental.com` (optional, for smoke test) |
| Secret | `CLOUDFLARE_API_TOKEN` | API token with `Workers Scripts:Edit`, `D1:Edit`, `R2:Edit` |

The token is NOT a global API key — issue it with **least-privilege scopes** at `dash.cloudflare.com/profile/api-tokens`.

---

## Three critical acceptance tests (rule #37)

Run these **after** a deploy to prove the migration survives a Worker redeploy:

### Test 1 — hero edit + image upload
1. Log into `/studio`
2. Change the hero headline to something unique (e.g. `ACCEPTANCE-2026-09-01`)
3. Upload a new hero image
4. Open the public homepage — confirm the new text and image
5. Run `npx wrangler deploy` to trigger a Worker redeploy
6. Re-open the public homepage — confirm the changes STILL exist

### Test 2 — article creation
1. Log into `/studio`
2. Add a new article with a unique slug
3. Open `/articles/<slug>` — confirm it renders
4. Open `/sitemap-content.xml` — confirm the URL is listed
5. Run `npx wrangler deploy`
6. Re-open the article URL and the sitemap — confirm both STILL contain it

### Test 3 — gallery upload
1. Log into `/studio`
2. Upload a new gallery image
3. Open `/gallery` — confirm the image is visible
4. Run `npx wrangler deploy`
5. Re-open `/gallery` — confirm the image STILL exists

The Playwright suite automates all three:

```bash
E2E_BASE_URL=https://jabaridental.com \
E2E_ADMIN_SECRET='<your-studio-password>' \
  npx playwright test tests/e2e/studio.spec.ts

# After you redeploy:
E2E_STAGE2=1 E2E_BASE_URL=... E2E_ADMIN_SECRET=... \
  npx playwright test tests/e2e/studio.spec.ts
```

---

## Architecture

```
┌────────────────── Browser ──────────────────┐
│  HTML/CSS (Tailwind v4) + minimal vanilla JS │
└───────────┬──────────────────────────┬──────┘
            │ HTTPS                     │ HTTPS
            ▼                           ▼
   ┌──────────────────┐       ┌─────────────────────┐
   │  Cloudflare Pages │       │ Cloudflare Workers  │
   │       n/a         │       │  (jabari-dental)    │
   └──────────────────┘       └──────────┬──────────┘
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                          ▼               ▼               ▼
                  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                  │   D1 (DB)   │  │   R2 (media) │  │   Secrets    │
                  └─────────────┘  └─────────────┘  └─────────────┘
```

There is **no local filesystem dependency** in production. Content lives in D1, uploaded media in R2. The Worker bundle in `dist/_worker.js/` is rebuilt on every deploy.

### Source layout

```
src/
  db/schema.ts            Drizzle schema (15 content tables)
  lib/
    platform.ts           Single source of truth for env.DB / getPublicAssetUrl()
    db.ts                 D1-backed store with the same public API as the previous file store
    auth.ts               HMAC session cookie, reads Cloudflare secret first
    schemas.ts            Zod schemas for every content-collection body
    store.ts              No-arg façade so pages/components don't need to change
    status.ts             Kampala time, open/closed status
    markdown.ts           XSS-safe article renderer
    whatsapp.ts           Booking message + deep-link helper
  pages/
    api/
      auth/login.ts       Rate-limited, constant-time password compare
      auth/logout.ts
      me.ts
      content/[coll].ts  GET/POST (D1 + Zod)
      content/[coll]/[id].ts  PUT/DELETE + reorder (D1 + Zod)
      upload.ts           R2 upload
      health.ts           200 no-store health probe
    studio/               Password-protected CMS UI
    treatments/, articles/, gallery.astro, ...
  components/             22 components, 8 section components
  layouts/Base.astro      Single shared layout (theme bootstrap, OG, JSON-LD)
  middleware.ts           CSP nonce, security headers, /studio + /api/* auth gate
  pages/                  Public pages
migrations/0000_initial.sql  D1 schema + indexes
scripts/
  deploy.mjs              Operator deployment wrapper
  push-to-github.mjs      Git push using already-configured git auth
  import-json-to-d1.mjs   One-time data/*.json -> D1
  seed-d1.mjs             Fresh-database seeder
wrangler.toml              Worker + D1 + R2 bindings
astro.cloudflare.mjs       Production build target
```

### Known limitations / out of scope

- **Production deployment has not been executed** — this repository contains the code. You (or GitHub Actions) run the deploy.
- **Namecheap DNS inspection** — performed manually before changing nameservers. The brief explicitly forbids blind DNS changes.
- **The original `data/*.json` files** are kept locally only as the one-time import source. They are gitignored and never read by the production Worker.

---

## License
Proprietary. All rights reserved by JABARI DENTAL.