/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

const allowedDevOrigins = process.env.DEV_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ["192.168.8.238", "192.168.8.239"];

/**
 * Sent on every response. The CSP is deliberately narrow: it stops injected
 * markup from re-pointing relative URLs (`base-uri`), posting a form, such as
 * a fake sign-in, anywhere but here (`form-action`), or loading plugins. It
 * leaves scripts alone (Next's inline bootstrap would need nonces) and sets
 * no `frame-ancestors`, because embedding the dashboard in another site is a
 * supported use (see `sessionCookieOptions`).
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  allowedDevOrigins,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
