# JABARI DENTAL — Complete Guide

Premium dental-clinic website + admin CMS, running on **Cloudflare Workers + D1 + R2**.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Cloudflare Account & Deployment](#cloudflare-account--deployment)
4. [Local Development](#local-development)

---

## Local Development

### Prerequisites

- Node.js 20+
- npm
- A Cloudflare account (for production resources)

### Setup

```bash
# Clone and install
git clone https://github.com/jabaridental/jabaridental.git
cd jabaridental
npm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Admin secrets (required at build time for Cloudflare target)
ADMIN_SECRET=change-me-in-production
AUTH_SECRET=replace-with-a-long-random-string-at-least-32-chars

# Public contact info (NOT env vars in production — edited via Studio)
PUBLIC_PHONE=256770590299
PUBLIC_WHATSAPP=256770590299
PUBLIC_SITE_URL=https://jabaridental.com
PUBLIC_MAPS_URL=https://maps.app.goo.gl/xb75PRmN25xptA1V7

# R2 public origin (must match wrangler.toml [vars])
MEDIA_PUBLIC_BASE_URL=https://media.jabaridental.com

# Deploy credentials (for scripts/deploy-rest.mjs)
CLOUDFLARE_API_TOKEN=your-token-here
CLOUDFLARE_ACCOUNT_ID=514cfc328f3cd9b546d808d3e71f0cf9
```

### Development Modes

**Option 1 — Frontend-only (fake data, no Cloudflare needed):**

```bash
npm install --save-dev @astrojs/node
npm run dev          # uses astro.dev.mjs (Node adapter, in-memory store)
```

**Option 2 — Full-stack (real Cloudflare bindings):**

---

## Project Structure

```
jabaridental/
├── .github/workflows/deploy.yml   # GitHub Actions CI/CD (OIDC → Cloudflare)
├── astro.cloudflare.mjs           # Production build config (Cloudflare adapter)
├── astro.dev.mjs                  # Local dev config (Node adapter)
├── wrangler.toml                  # Worker + D1 + R2 bindings + routes
├── package.json                   # Dependencies + scripts
├── tsconfig.json                  # TypeScript config
├── drizzle.config.ts              # Drizzle Kit (D1 migrations)
├── migrations/
│   └── 0000_initial.sql           # D1 schema (15 content tables)
├── data/                          # Seed data (one-time import source)
│   ├── site.json, hero.json, contact.json, hours.json
│   ├── treatments.json, articles.json, team.json, gallery.json
│   ├── faqs.json, testimonials.json, announcements.json
│   ├── offers.json, social.json, specialHours.json, beforeAfter.json
├── scripts/
│   ├── deploy-rest.mjs            # Token-based deploy (CI/headless)
│   ├── deploy.mjs                 # Interactive wrangler deploy
│   ├── import-json-to-d1.mjs      # Import data/*.json → D1
│   ├── seed-d1.mjs                # Fresh-database seeder
│   ├── write-assetsignore.mjs     # Generates dist/.assetsignore
│   ├── gen-icons.mjs              # Icon generator
│   ├── gen-assets.mjs             # Placeholder asset generator
│   ├── optimize-images.mjs       # Image optimizer
│   └── push-to-github.mjs         # Git push helper
├── src/
│   ├── db/schema.ts               # Drizzle schema (15 tables)
│   ├── lib/
│   │   ├── platform.ts            # Env abstraction (DB/R2/secrets)
│   │   ├── db.ts                  # D1 data access layer
│   │   ├── store.ts               # No-arg façade for pages
│   │   ├── auth.ts                # HMAC session cookie
│   │   ├── schemas.ts             # Zod validation schemas
│   │   ├── media.ts               # R2 upload (MIME sniff, 10MB cap)
│   │   ├── status.ts              # Open/closed status (Kampala time)
│   │   ├── markdown.ts            # XSS-safe renderer
│   │   └── whatsapp.ts            # Booking deep-link helper
│   ├── middleware.ts               # CSP, security headers, auth gate
│   ├── layouts/
│   │   └── Base.astro             # Shared layout (theme, OG, JSON-LD)
│   ├── components/                # 22 UI components
│   │   ├── Navbar.astro, Footer.astro, UtilityBar.astro
│   │   ├── AnnouncementBar.astro, MobileActionBar.astro
│   │   ├── TreatmentCard.astro, TreatmentGrid.astro
│   │   ├── ArticleCard.astro, ArticleGrid.astro
│   │   ├── Gallery.astro, TeamGrid.astro
│   │   ├── TestimonialCarousel.astro, BeforeAfterSlider.astro
│   │   ├── FAQ.astro, BookingWizard.astro, FeaturedTreatment.astro
│   │   ├── CtaButton.astro, SmartImage.astro, Icon.astro
│   │   └── PWAInstall.astro
│   └── pages/
│       ├── index.astro            # Home
│       ├── about.astro

---

## Building the Site

### Production Build

```powershell
# PowerShell
$env:AUTH_SECRET='your-32-char-minimum-secret'
$env:ADMIN_SECRET='your-studio-password'
npm run build
```

```bash
# bash
AUTH_SECRET="..." ADMIN_SECRET="..." npm run build
```

**What happens:**
1. `astro build --config astro.cloudflare.mjs` → SSR build into `dist/`
2. `node scripts/write-assetsignore.mjs` → writes `dist/.assetsignore` containing `_worker.js` so the Worker bundle is NOT uploaded as a public static asset

**Build output:**
- `dist/_worker.js/index.js` — the SSR Worker entry (referenced by `main` in wrangler.toml)
- `dist/_worker.js/pages/` — lazy-loaded page chunks
- `dist/_worker.js/chunks/` — shared chunks
- `dist/_astro/` — client JS/CSS
- `dist/` — public/ assets (images, icons, manifest, etc.)
- `dist/_routes.json` — tells Cloudflare which requests hit the Worker vs. static assets


---

## Deploying to Production

### Method 1: GitHub Actions (recommended for CI)

The repo includes `.github/workflows/deploy.yml` using **OIDC federation** (no long-lived secrets in GitHub).

**Setup:**
1. In GitHub: Settings → Secrets and variables → Actions:
   - Variable `CLOUDFLARE_ACCOUNT_ID` = `514cfc328f3cd9b546d808d3e71f0cf9`
   - Variable `CLOUDFLARE_DATABASE_ID` = `56b86e4d-14ad-432e-b427-d67cc3b786f2`
   - Variable `E2E_BASE_URL` = your preview URL (optional, for smoke tests)
   - Secret `CLOUDFLARE_API_TOKEN` = token with Workers/D1/R2 edit scopes
2. Push to `main` → workflow builds, migrates, deploys, and smoke-tests.

### Method 2: Token-based deploy (headless/CI)

```powershell
$env:CLOUDFLARE_API_TOKEN='your-token'
$env:CLOUDFLARE_ACCOUNT_ID='514cfc328f3cd9b546d808d3e71f0cf9'
$env:AUTH_SECRET='32+-char-random'
$env:ADMIN_SECRET='your-password'
node scripts/deploy-rest.mjs --import
```

`deploy-rest.mjs` accepts flags:

| Flag | Effect |
|------|--------|
| `--build` / `-b` | Build before deploying |
| `--import` | Import `data/*.json` into D1 after migrations |
| `--no-migrate` | Skip migration apply |
| `--no-deploy` | Stop after migrations + import |
| `DRY_RUN=1` | Print API calls without making them |
| `SKIP_DEPLOY=1` | Same as `--no-deploy` |

### Method 3: Wrangler CLI (interactive)

```bash
npx wrangler login
npx wrangler d1 create jabari-dental-db        # paste returned id into wrangler.toml
npx wrangler r2 bucket create jabari-dental-media
npm run db:migrate:remote
npx wrangler deploy
```

### First-Time Database Setup

If D1 is empty (fresh account), apply schema and seed:

```powershell
# Apply migrations (creates 15 tables)
npm run db:migrate:remote

---

## Modifying Content

### Via the Studio CMS (recommended)

1. Go to `https://jabaridental.com/studio/login`
2. Log in with `ADMIN_SECRET` (from `.env`)
3. Edit any collection: site info, hero, contact, hours, treatments, articles, team, gallery, FAQs, testimonials, announcements, offers, social links, before/after cases
4. Changes are saved to D1 and take effect **immediately** — no redeploy needed

### Via the API

All content is readable/writable through REST endpoints:

| Endpoint | Methods |
|----------|---------|
| `/api/content/[collection]` | GET (list), POST (create) |
| `/api/content/[collection]/[id]` | GET, PUT, DELETE, POST (reorder) |
| `/api/health` | GET (200 probe) |
| `/api/auth/login` | POST |
| `/api/auth/logout` | POST |
| `/api/me` | GET (session info) |
| `/api/upload` | POST (R2 image upload) |

### Via D1 Directly

```bash
# Query remote D1
npx wrangler d1 execute DB --remote --command "SELECT * FROM treatments"

# Execute SQL file
npx wrangler d1 execute DB --remote --file=query.sql
```

### Collections & Schema

The 15 content collections (see `src/db/schema.ts`):

| Collection | Description |
|------------|-------------|
| `site` | Clinic name, tagline, location, brand colors, logo |
| `hero` | Homepage hero (headline, image, CTAs) |
| `contact` | Phone, WhatsApp, email, map URL |
| `hours` | Weekly opening hours |
| `special_hours` | Holiday/special schedules |
| `treatments` | Dental procedures (slug, body, price, FAQ) |
| `articles` | Blog posts (slug, body, SEO) |
| `team` | Staff members (photo, bio, role) |
| `gallery` | Clinic images |

---

## Customizing the Design

### Where to Modify

| What | Where |
|------|-------|
| Colors, fonts, radii, shadows | `src/styles/global.css` (`@theme` block) |
| Dark mode overrides | `src/styles/global.css` (`.dark { ... }`) |
| Page templates | `src/pages/**/*.astro` |
| Shared layout (head, nav, footer) | `src/layouts/Base.astro` |
| Reusable components | `src/components/*.astro` |
| Navigation | `src/components/Navbar.astro` |
| Footer | `src/components/Footer.astro` |
| Top utility bar (status, clock, theme) | `src/components/UtilityBar.astro` |
| SEO meta / JSON-LD | `src/layouts/Base.astro` |
| Security headers / CSP | `src/middleware.ts` |

### Design Tokens

Edit `src/styles/global.css`:

```css
@theme {
  --color-ivory: #f6f1e8;      /* page background */
  --color-forest: #003C80;     /* primary brand */
  --color-gold: #b08d57;       /* accent */
  --font-display: "Fraunces", ...;
  --font-sans: "Inter", ...;
}
```

Tailwind v4 uses CSS `@theme` — no `tailwind.config` needed.

### Adding a New Page

1. Create `src/pages/my-page.astro`
2. Use the Base layout: `import Base from '@/layouts/Base.astro'`
3. Fetch data: `const site = await getSite()` (works via the no-arg façade)
4. Add nav link in `src/components/Navbar.astro`

### Adding a New API Route


---

## Theme (Light/Dark Mode)

**Light mode is the default.** The site remembers the user's choice in `localStorage`.

### How it works

| File | Role |
|------|------|
| `src/layouts/Base.astro` | Inline script reads `localStorage.theme` (default `"light"`) and toggles `.dark` on `<html>` |
| `src/styles/global.css` | `.dark { ... }` block remaps CSS variables for dark surfaces |
| `src/components/UtilityBar.astro` | Toggle button (`data-theme-toggle`) + icon sync |

### Change the default back to dark

Edit the inline script in `src/layouts/Base.astro`:

```javascript
// Current (light default):
var t = localStorage.getItem("theme") || "light";

// Change to dark default:
var t = localStorage.getItem("theme") || "dark";
```

### Disable the toggle

Remove the `<button data-theme-toggle>` from `src/components/UtilityBar.astro`.

---

## The Studio CMS

### Access

`https://jabaridental.com/studio/login` → log in with `ADMIN_SECRET`.

### Auth Model

- Single admin, password = `ADMIN_SECRET`
- Brute-force protection: rate-limited login attempts
- Session: HMAC-SHA256 signed cookie (`jab_admin`), 8-hour expiry

---

## Troubleshooting

### Build fails: "AUTH_SECRET is not set"

The Cloudflare build (`astro.cloudflare.mjs`) refuses to build without `AUTH_SECRET` (min 32 chars) and `ADMIN_SECRET`. Set them in your shell or `.env`.

### `wrangler deploy` hangs

This was a known issue with the `[assets]` block. Fixed by `scripts/write-assetsignore.mjs` which generates `dist/.assetsignore`. Run `npm run build` (not just `astro build`) to ensure it runs.

### 500 errors in production: "D1 not available"

The Worker can't reach the D1 binding. Check:
- `database_id` in `wrangler.toml` matches the actual D1 UUID
- Binding name `DB` matches `env.DB` usage in code
- D1 migrations have been applied (`npm run db:migrate:remote`)

### Console errors: "Executing inline script violates … CSP directive"

Astro inlines small `<script>` tags into the HTML **without** the per-request
CSP nonce, so a nonce-based `script-src` blocks them (this used to silently
kill the service-worker registration → PWA, the mobile nav, the FAQ
accordion, the gallery and the testimonial carousel). Fixed in
`src/middleware.ts`: `addNonceToInlineScripts()` stamps the nonce onto every
inline `<script>` before the response is sent. If you ever reintroduce this
symptom, check that HTML responses pass through `applySecurityHeaders()` and
that the middleware nonce matches `Astro.locals.cspNonce`.

### Some seeded content missing after deploy

The old `scripts/seed-d1.mjs` only wrote site/hero/contact/treatments (and
wrote NULLs for nested fields). The rewritten seeder writes all 15
collections from `src/data/seed.ts` in one SQL batch — re-run:

```powershell
npm run db:seed:remote
```

See `DEPLOY-FIX.md` for the full production repair runbook.

### Custom domain not working

1. Zone must be in the same Cloudflare account as the Worker
2. Domain must be attached: Workers → jabari-dental → Settings → Triggers → Custom Domains
3. DNS: ensure the domain resolves (proxied CNAME or A/AAAA records)
4. SSL: Cloudflare provisions certs automatically (may take a few minutes)

### Images not loading

- R2 bucket must be created and the binding name must match (`MEDIA_BUCKET`)
- `MEDIA_PUBLIC_BASE_URL` must be reachable (R2 public access or a CDN in front of R2)
- Check `wrangler.toml [vars]` matches the actual public URL

---

## Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `npm run dev` | Local Astro dev server |
| `dev:cf` | `npm run dev:cf` | `wrangler dev` (real bindings) |
| `build` | `npm run build` | Build + generate `.assetsignore` |
| `preview` | `npm run preview` | Preview production build locally |
| `deploy` | `npm run deploy` | `wrangler deploy` |
| `deploy:rest` | `npm run deploy:rest` | Token-based deploy |
| `check` | `npm run check` | Astro type-check |
| `db:generate` | `npm run db:generate` | Generate D1 migration SQL |
| `db:migrate:local` | `npm run db:migrate:local` | Apply migrations to local D1 |
| `db:migrate:remote` | `npm run db:migrate:remote` | Apply migrations to production D1 |
| `db:seed:remote` | `npm run db:seed:remote` | Seed fresh production D1 |
| `import:json` | `npm run import:json` | Import `data/*.json` → D1 |
| `gen:icons` | `npm run gen:icons` | Generate PWA icons |
| `gen:assets` | `npm run gen:assets` | Generate placeholder assets |
| `optimize:images` | `npm run optimize:images` | Optimize public images |

---

## License

Proprietary. All rights reserved by JABARI DENTAL.
- Constant-time password compare (SHA-256 hash both sides)

### Editing Content

The Studio provides forms for every collection. All edits go through Zod validation and persist to D1 immediately.

### Image Uploads

- Uploaded to R2 (`jabari-dental-media`) via `/api/upload`
- Stored at `uploads/YYYY/MM/<random>.<ext>`
- MIME allow-list: JPEG, PNG, WebP, GIF (no SVG — XSS risk)
- Magic-byte sniffing (defense-in-depth)
- 10 MB max
- Public URL built from `MEDIA_PUBLIC_BASE_URL`
1. Create `src/pages/api/my-route.ts`
2. Export `GET` / `POST` etc. as `APIRoute` handlers
3. Access bindings via `Astro.locals.runtime.env`
4. Validate with Zod: `import { validateCollectionBody } from '@/lib/schemas'`
| `before_after` | Patient cases |
| `testimonials` | Patient reviews |
| `announcements` | Promotional banners |
| `offers` | Special offers |
| `social` | Social media links |
| `media` | R2 upload metadata |

Validation uses Zod schemas in `src/lib/schemas.ts`.

# Import seed data
npm run db:seed:remote
# or
node scripts/import-json-to-d1.mjs --remote
```
### Why `.assetsignore`?

`@astrojs/cloudflare` v12 emits the Worker bundle into `dist/_worker.js/` and client assets directly into `dist/`. With `[assets] directory = "./dist"`, wrangler walks the whole `dist/` tree. Without `.assetsignore`, it would try to upload `dist/_worker.js/` as public static assets — exposing server-side code. The fix is a `dist/.assetsignore` file containing `_worker.js`.
│       ├── treatments/[slug].astro, treatments/index.astro
│       ├── articles/[slug].astro, articles/index.astro, articles/rss.xml.ts
│       ├── gallery.astro, contact.astro, book.astro
│       ├── patient-experience.astro, search.astro
│       ├── privacy.astro, terms.astro
│       ├── sitemap-content.xml.ts, 404.astro
│       ├── studio/login.astro, studio/index.astro
│       └── api/
│           ├── health.ts, me.ts
│           ├── auth/login.ts, auth/logout.ts
│           ├── content/[collection].ts, content/[collection]/[id].ts
│           └── upload.ts
├── public/                        # Static assets (copied to dist/)
│   ├── images/, icons/
│   ├── favicon.ico / favicon.svg
│   ├── manifest.webmanifest, robots.txt, sw.js, offline.html
└── tests/e2e/studio.spec.ts       # Playwright acceptance tests
```

```bash
# One-time: create local D1 + R2
npx wrangler d1 create jabari-dental-db --local
npx wrangler r2 bucket create jabari-dental-media

# Apply migrations + seed data
npm run db:migrate:local
npm run db:seed:local      # imports data/*.json into local D1

# Run wrangler dev (exposes DB + R2 bindings)
npm run dev:cf
```
5. [Project Structure](#project-structure)
6. [Building the Site](#building-the-site)
7. [Deploying to Production](#deploying-to-production)
8. [Modifying Content](#modifying-content)
9. [Customizing the Design](#customizing-the-design)
10. [Theme (Light/Dark Mode)](#theme-lightdark-mode)
11. [The Studio CMS](#the-studio-cms)
12. [Troubleshooting](#troubleshooting)
13. [Scripts Reference](#scripts-reference)

---

## Overview

JABARI DENTAL is a server-rendered Astro 5 website for a premium dental clinic in Kampala, Uganda. It includes:

- Public-facing pages (home, about, treatments, articles, gallery, contact, etc.)
- An admin **Studio CMS** (`/studio`) for editing all clinic content
- JSON-LD `Dentist` schema, sitemaps, RSS, SEO metadata
- PWA support (service worker, manifest, offline page)
- Light/dark mode (light is default)
- R2-backed image uploads for the studio

All content is stored in **Cloudflare D1** (SQLite at the edge). There is no build-time content — everything is fetched from D1 at request time, so content changes via the Studio take effect immediately with no redeploy.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 5 (SSR mode) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Media Storage | Cloudflare R2 |
| Auth | HMAC-SHA256 session cookie |
| Build output | `dist/_worker.js/` (Worker bundle) + `dist/` (static assets) |

---

## Cloudflare Account & Deployment

### Account Used for Deployment

The deployment target is the **Cloudflare account**:

- **Account ID:** `514cfc328f3cd9b546d808d3e71f0cf9`
- **Account Name:** `Almarehan252@gmail.com's Account`

> This is the account where the Worker, D1 database, and R2 bucket live. The `jabaridental.com` zone is in a *different* account (`3f741aa105bcbe71a5173a52be5251ef` / `Jabaridental@protonmail.com`). For full production with the custom domain, resources should be consolidated into one account.

### Required Cloudflare Resources

| Resource | Name | ID / Status |
|----------|------|-------------|
| Worker | `jabaridental` | Deployed |
| D1 Database | `jabari-dental-db` | `56b86e4d-14ad-432e-b427-d67cc3b786f2` |
| R2 Bucket | `jabari-dental-media` | Created |
| Custom Domains | `jabaridental.com`, `www.jabaridental.com` | Attached |

### Required API Token Permissions

To deploy, create an API token at [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) with:

| Resource | Permission |
|----------|-----------|
| Account → Workers Scripts | **Edit** |
| Account → D1 | **Edit** |
| Account → R2 | **Edit** |
| Account → Workers Domains | **Edit** |
| Zone → DNS | **Edit** |
| User → User Details | **Read** |

Select **Account** `514cfc328f3cd9b546d808d3e71f0cf9` as the account resource.