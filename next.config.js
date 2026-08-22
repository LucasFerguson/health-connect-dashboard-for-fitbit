/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

const allowedDevOrigins = process.env.DEV_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ["192.168.8.238", "192.168.8.239"];

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  allowedDevOrigins,
};

export default config;
