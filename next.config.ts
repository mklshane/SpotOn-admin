import type { NextConfig } from "next";

// Security headers. Tokens live in localStorage, so any XSS could steal an admin
// session — the CSP is the main defence. This is a static client app (no
// per-request rendering), so nonces aren't available; per the Next.js CSP guide
// ("Without Nonces") scripts use 'self' 'unsafe-inline' for Next's inline
// bootstrap, with 'unsafe-eval' only in dev (React's debug tooling needs it).

const isDev = process.env.NODE_ENV === "development";

function originOf(url: string | undefined, fallback: string): string {
  try {
    return new URL(url ?? fallback).origin;
  } catch {
    return new URL(fallback).origin;
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:8000");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: = research images (object URLs); *.supabase.co = facility photos
  // (Supabase Storage public URLs in facilities.photo_url, migration 011).
  "img-src 'self' blob: data: https://*.supabase.co",
  "font-src 'self'", // next/font self-hosts Google fonts at build time
  `connect-src 'self' ${apiOrigin}${isDev ? " ws: wss:" : ""}`, // ws: = dev HMR
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only when the API is HTTPS — upgrading would break a local http://localhost:8000 backend.
  ...(!isDev && apiOrigin.startsWith("https:") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
