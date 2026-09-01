import { defineConfig, devices } from "playwright/test";

/**
 * Playwright config for the JABARI DENTAL E2E suite.
 *
 * The suite is designed to run against the live production URL set via
 * `E2E_BASE_URL`. When that env var is missing every spec is skipped, so
 * this can be safely included in CI without breaking builds that don't have
 * a production URL configured.
 *
 * Run against production (after deploy):
 *   E2E_BASE_URL=https://jabaridental.com \
 *   E2E_ADMIN_SECRET=<your-studio-password> \
 *     npx playwright test
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "mobile-320", use: { ...devices["Pixel 5"] } },
    { name: "mobile-375", use: { ...devices["iPhone 12"] } },
    { name: "tablet-768", use: { ...devices["iPad Mini"] } },
    { name: "laptop-1024", use: { viewport: { width: 1024, height: 768 } } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
});