# Production Fix Runbook — jabaridental.com

This is the step-by-step fix for the issues seen after deploying to Cloudflare:

1. **Some seed data not showing** → the D1 database was never fully seeded
   (the old seeder only wrote 4 of 15 collections).
2. **PWA not working** → the CSP nonce blocked the inlined service-worker
   registration script (and several other page scripts). **Fixed in code**
   (`src/middleware.ts` now stamps the nonce onto every inline `<script>`),
   but a **rebuild + redeploy is required** for it to take effect.
3. **Audio** → the ambient sound feature and its pause/fade workaround have
   been **removed entirely** (component, mp3 file, volume icons).
4. **Studio not working after entering the password** → the login endpoint
   itself is healthy (`401 Invalid password` was observed on the live API),
   so the password being typed does not match the `ADMIN_SECRET` secret set
   on the Worker — or too many failed attempts triggered the 15-minute
   lockout. Step 4 below fixes/verifies this.

> All commands run from the project root, logged into the **correct**
> Cloudflare account (the one that owns jabaridental.com — check with
> `npx wrangler whoami`; the email should be the one you see in the
> dashboard next to the worker).

---

## Step 0 — Confirm you are on the right Cloudflare account

```powershell
npx wrangler whoami
```

The account must own the `jabaridental.com` zone and the `jabaridental`
Worker with the `DB` (D1) and `MEDIA_BUCKET` (R2) bindings you saw in the
dashboard.

## Step 1 — Verify the D1 database id in `wrangler.toml`

```powershell
npx wrangler d1 list
```

- If a database named `jabari-dental-db` exists, make sure its UUID matches
  `database_id` in `wrangler.toml` (`56b86e4d-14ad-432e-b427-d67cc3b786f2`).
  If it differs, update `wrangler.toml`.
- If it does **not** exist, create it and update `wrangler.toml`:

```powershell
npx wrangler d1 create jabari-dental-db
# copy the database_id from the output into wrangler.toml
```

## Step 2 — Apply the schema migrations

```powershell
npm run db:migrate:remote
```

This creates the 15 content tables (`site`, `hero`, `treatments`, …) on the
remote D1. Safe to re-run (wrangler tracks applied migrations).

## Step 3 — Seed ALL the content (fixes "some data not showing")

```powershell
npm run db:seed:remote
```

The rewritten seeder now:

- loads `src/data/seed.ts` directly (no more hand-maintained field lists),
- writes `data/*.json` sources you can edit and re-import later,
- inserts **every** collection (site, hero, contact, social, hours,
  specialHours, announcements, offers, treatments, team, gallery,
  beforeAfter, testimonials, articles, faqs) in one SQL batch,
- no longer writes NULLs for nested fields like `brandColors.primary`.

> ⚠️ It uses `INSERT OR REPLACE` — it overwrites rows with the same ids.
> Do **not** run it against a database that already holds real clinic
> content you want to keep. (For a safe merge use `npm run import:json`.)

## Step 4 — Set the studio password (fixes the login problem)

The studio password IS the Worker secret `ADMIN_SECRET`. Set it to whatever
you want to type at `/studio/login`:

```powershell
npx wrangler secret put ADMIN_SECRET
# paste your chosen password when prompted, press Enter

npx wrangler secret put AUTH_SECRET
# paste a long random string (32+ chars) — signs the admin session cookie
```

Verify they exist:

```powershell
npx wrangler secret list
# expect: ADMIN_SECRET, AUTH_SECRET
```

Notes:
- After 8 failed attempts the login endpoint locks that IP out for
  **15 minutes** — if you saw "Too many attempts", that's why. It clears
  itself (or redeploy, which restarts the isolate).
- Changing `ADMIN_SECRET` takes effect immediately; no redeploy needed.

## Step 5 — Rebuild and deploy (ships all the code fixes)

The build refuses to run without the two secrets present as **build-time**
env vars, so set them in the same PowerShell session first:

```powershell
$env:AUTH_SECRET  = "a-long-random-string-at-least-32-chars"
$env:ADMIN_SECRET = "your-studio-password"
npm run build
npx wrangler deploy
```

(You can use throwaway values for the build env vars — the real ones are the
Worker secrets from Step 4; the build values are only needed so the build
guard passes and should NOT be the real production values if others can see
your machine.)

## Step 6 — Verify the deployment

```powershell
# 1. Health endpoint is now public (no auth required) — expect {"ok":true,...}
curl.exe -s https://jabaridental.com/api/health

# 2. No more CSP violations: open the site in a browser, press F12 → Console
#    → reload → there must be NO "Executing inline script violates..." errors.

# 3. PWA: on the same console, after reload:
#    navigator.serviceWorker.getRegistrations()  → non-empty
#    Application tab → Service Workers → "activated and is running"

# 4. Content spot-check: treatments/team/gallery pages show the seeded items.

# 5. Studio: https://jabaridental.com/studio/login → sign in with the
#    password from Step 4.
```

Also do a hard refresh (Ctrl+Shift+R) or clear the old service worker:
DevTools → Application → Service Workers → Unregister, then reload — the
new build ships cache version `jabari-v3`, which purges stale caches on the
next visit automatically.
