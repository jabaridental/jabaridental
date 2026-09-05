import { defineMiddleware } from "astro/middleware";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getPlatform } from "@/lib/platform";
import { setRequestLocals } from "@/lib/store";

const PUBLIC_API = ["/api/auth/login", "/api/auth/logout", "/api/me", "/api/health"];

// Generate a per-request CSP nonce. 16 random bytes → base64 ≈ 22 chars.
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, "");
}

/**
 * Baseline security headers.
 *
 * Note on CSP: the site uses a few Astro inline scripts (theme bootstrap,
 * JSON-LD) and Google Fonts, so we allow 'unsafe-inline' for style-src and
 * we include a nonce in script-src. The directives that matter most still
 * apply: object-src/base-uri are locked down and frame-ancestors prevents
 * clickjacking.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // Scripts: same-origin bundles plus the per-request nonce. Inline scripts
    // that are not nonce-tagged are blocked.
    `script-src 'self' 'nonce-${nonce}'`,
    // Styles: Google Fonts stylesheet + Astro inline styles. nonce doesn't
    // work reliably for Astro-generated <style> blocks; 'unsafe-inline' is
    // the only practical option without a build-time nonce pipeline.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: same-origin, data: (inline SVGs in CMS), and the R2 public
    // hostname (configured in wrangler.toml). This is what unblocks the
    // getPublicAssetUrl() URLs without leaking `*`.
    `img-src 'self' data: blob: ${getR2HostForCsp()}`,
    "media-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "manifest-src 'self'",
  ].join("; ");
}

/** Read MEDIA_PUBLIC_BASE_URL from env so CSP allows the R2 host. */
function getR2HostForCsp(): string {
  const url = process.env.MEDIA_PUBLIC_BASE_URL || "";
  if (!url) return "";
  try { return new URL(url).origin; } catch { return ""; }
}

/**
 * Astro bundles <script> tags used in components and pages; when the resulting
 * chunk is small, Astro INLINES it into the HTML as <script type="module"> —
 * WITHOUT any nonce attribute. Under a nonce-based script-src CSP those
 * scripts are blocked (this silently killed the service-worker registration,
 * the mobile nav, the FAQ accordion, the gallery, the testimonial carousel,
 * the PWA install button, etc.).
 *
 * Astro does not currently stamp nonces on its own inlined scripts, so we do
 * it here: every inline <script> (one without a src= attribute) that lacks a
 * nonce gets the per-request nonce. Tags that already carry one (theme
 * bootstrap, JSON-LD) and external bundles (src=) are left untouched.
 */
function addNonceToInlineScripts(html: string, nonce: string): string {
  return html.replace(/<script(?![^>]*\bsrc=)([^>]*)>/gi, (match, attrs: string) => {
    if (/\bnonce\s*=/i.test(attrs)) return match;
    return `<script nonce="${nonce}"${attrs}>`;
  });
}

function applySecurityHeaders(res: Response, isHttps: boolean, path: string, nonce: string): Response {
  const h = res.headers;
  // Don't clobber headers an upstream proxy/CDN may have set intentionally.
  if (!h.has("content-security-policy")) h.set("content-security-policy", buildCsp(nonce));
  if (!h.has("x-content-type-options")) h.set("x-content-type-options", "nosniff");
  if (!h.has("x-frame-options")) h.set("x-frame-options", "DENY");
  if (!h.has("referrer-policy")) h.set("referrer-policy", "strict-origin-when-cross-origin");
  if (!h.has("permissions-policy")) {
    h.set("permissions-policy", "geolocation=(), microphone=(), camera=(), payment=()");
  }
  if (isHttps && !h.has("strict-transport-security")) {
    h.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }
  // Cache-Control for public HTML pages — lets a CDN (Cloudflare, nginx)
  // absorb repeat traffic without round-tripping the origin. We deliberately
  // skip /studio (must not cache behind auth) and /api/* (always dynamic).
  const isHtml = (h.get("content-type") || "").includes("text/html");
  if (isHtml && !path.startsWith("/studio") && !path.startsWith("/api/")) {
    if (!h.has("cache-control")) {
      h.set(
        "cache-control",
        "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
      );
    }
  }
  if (!isHtml) return res;

  // Buffer the HTML and stamp the nonce onto Astro's inlined scripts. The
  // nonce in the CSP header and the ones on the tags therefore always match,
  // including when the response is served from the CDN cache (headers and
  // body are cached together).
  return res.text().then((body) => {
    const patched = addNonceToInlineScripts(body, nonce);
    return new Response(patched, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, cookies, redirect, locals } = context;
  const path = url.pathname;
  // Respect the proxy's protocol header when running behind nginx/Cloudflare.
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const isHttps = proto === "https";

  // Expose the platform abstraction to pages and API routes. Locals typing is
  // augmented in src/env.d.ts.
  locals.platform = getPlatform(locals as any);
  // Mirror it into the no-arg façade so the existing `await getSite()` style
  // calls in pages/components keep working. The no-arg path still flows
  // through getPlatform() (in src/lib/db.ts), so we must keep `runtime` so
  // getPlatform can reach the D1/R2 bindings.
  setRequestLocals({ platform: locals.platform, runtime: (locals as any).runtime });

  // Generate a per-request CSP nonce. The HTML inline scripts that need it
  // pick it up via `Astro.locals.cspNonce`. This lets us drop 'unsafe-inline'
  // for scripts in production while keeping the inline JSON-LD and theme
  // bootstrap working.
  locals.cspNonce = generateNonce();

  // API protection
  if (path.startsWith("/api/")) {
    if (PUBLIC_API.includes(path)) {
      return applySecurityHeaders(await next(), isHttps, path, locals.cspNonce);
    }
    const authed = verifyToken(cookies.get(COOKIE_NAME)?.value, locals.platform);
    if (!authed) {
      return applySecurityHeaders(
        new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
        isHttps,
        path,
        locals.cspNonce
      );
    }
    return applySecurityHeaders(await next(), isHttps, path, locals.cspNonce);
  }

  // Studio protection
  if (path.startsWith("/studio")) {
    if (path === "/studio/login") return applySecurityHeaders(await next(), isHttps, path, locals.cspNonce);
    const authed = verifyToken(cookies.get(COOKIE_NAME)?.value, locals.platform);
    if (!authed) return redirect("/studio/login");
    return applySecurityHeaders(await next(), isHttps, path, locals.cspNonce);
  }

  return applySecurityHeaders(await next(), isHttps, path, locals.cspNonce);
});
