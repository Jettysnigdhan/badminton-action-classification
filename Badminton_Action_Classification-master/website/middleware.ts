import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request nonce-based Content-Security-Policy.
 *
 * Next.js App Router hydrates by emitting inline <script> tags (the RSC
 * payload, `self.__next_f.push(...)`). A static `script-src 'self'` policy
 * blocks those inline scripts, so hydration never completes and the page
 * renders blank. The correct fix is a per-request nonce that Next.js
 * automatically stamps onto its own script tags, combined with
 * 'strict-dynamic' so the loader can pull in chunks.
 *
 * In development we relax script-src (Next's dev runtime relies on eval and
 * un-nonced inline scripts for Fast Refresh / HMR), and allow the HMR
 * websocket via connect-src.
 */
const SESSION_COOKIE = "sc_session";

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  // ── Auth routing ────────────────────────────────────────────────────────
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // Protect the authenticated application.
  if (pathname.startsWith("/app") && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Avoid redirect loops caused by stale or invalid session cookies. The app
  // routes themselves enforce auth, and the auth pages should remain reachable.
  const nonce = btoa(crypto.randomUUID());

  const mediaPipeScriptSrc = "https://cdn.jsdelivr.net";
  const mediaPipeConnectSrc = "https://cdn.jsdelivr.net https://storage.googleapis.com";

  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${mediaPipeScriptSrc}`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${mediaPipeScriptSrc}`;

  const connectSrc = isDev
    ? `connect-src 'self' ws: wss: ${mediaPipeConnectSrc}`
    : `connect-src 'self' ${mediaPipeConnectSrc}`;

  const hostname = request.nextUrl.hostname;
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.");

  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    // Tailwind's runtime critical CSS and Framer Motion inline transforms
    // require 'unsafe-inline' for styles. Style injection is not an XSS vector
    // the way script injection is.
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    connectSrc,
    "worker-src 'self' blob:",
  ];

  if (!isDev && !isLocal) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  const csp = cspDirectives.join("; ");

  // Forward the nonce + CSP on the request so Next.js can read the nonce and
  // apply it to framework-emitted script tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Apply to document requests only. Skip static assets, images, and the API,
    // and skip prefetches (a cached prefetch would carry a stale nonce and
    // trigger a hydration mismatch).
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
