import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    API_URL: z.string().url().optional(),
    API_USERNAME: z.string().min(1).optional(),
    API_PASSWORD: z.string().min(1).optional(),
    ANALYTICS_MONGO_URI: z.string().url().optional(),
    ANALYTICS_DATABASE: z.string().min(1).optional(),
    DEV_ALLOWED_ORIGINS: z.string().min(1).optional(),
    HEALTH_HOME_TIME_ZONE: z.string().min(1).optional(),
    SLEEP_TARGET_MINUTES: z.coerce.number().int().min(240).max(720).optional(),
    HEALTH_BIRTH_DATE: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_URL: process.env.API_URL,
    API_USERNAME: process.env.API_USERNAME,
    API_PASSWORD: process.env.API_PASSWORD,
    ANALYTICS_MONGO_URI: process.env.ANALYTICS_MONGO_URI,
    ANALYTICS_DATABASE: process.env.ANALYTICS_DATABASE,
    DEV_ALLOWED_ORIGINS: process.env.DEV_ALLOWED_ORIGINS,
    HEALTH_HOME_TIME_ZONE: process.env.HEALTH_HOME_TIME_ZONE,
    SLEEP_TARGET_MINUTES: process.env.SLEEP_TARGET_MINUTES,
    HEALTH_BIRTH_DATE: process.env.HEALTH_BIRTH_DATE,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
