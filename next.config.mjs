/**
 * `standalone` output so the Docker image carries only the server and the modules it
 * actually uses, not the whole of node_modules.
 *
 * The security headers are the ones a banking page should have on day one: no framing
 * (clickjacking), no MIME sniffing, no referrer leaking account URLs to third parties,
 * and a content security policy that only allows this origin.
 */
import { fileURLToPath } from "node:url";

const isDev = process.env.NODE_ENV !== "production";
// Pinned, because Next otherwise guesses the root from the nearest lockfile above the
// project, and a stray one in a parent folder nests the standalone output under it.
const root = fileURLToPath(new URL(".", import.meta.url));

const csp = [
  "default-src 'self'",
  // Next injects small inline bootstrap scripts; dev also needs eval for fast refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: { root },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
