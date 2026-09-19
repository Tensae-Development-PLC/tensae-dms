import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    SYSADMIN_EMAIL: z.string().email().optional(),
    SYSADMIN_PASSWORD: z.string().min(12).optional(),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: z.coerce.boolean().optional(),
    SMTP_USER: z.string().email().optional(),
    SMTP_PASS: z.string().min(1).optional(),
    /** Alias for SMTP_PASS (matches Tensae Verify env naming). */
    SMTP_PASSWORD: z.string().min(1).optional(),
    SMTP_FROM: z.string().min(1).optional(),
    /** Inbox for public contact form submissions. */
    CONTACT_INQUIRY_TO: z.string().email().optional(),
    /** Browser-facing app origin (invite/reset/share links). e.g. http://localhost:3000 or http://YOUR_VPS_IP */
    PUBLIC_APP_BASE_URL: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().url().optional()),
    /** Public API origin without path (signed download URLs). e.g. http://localhost:4000 or http://YOUR_VPS_IP */
    PUBLIC_API_BASE_URL: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().url().optional()),
    /** Comma-separated list of allowed browser origins (e.g. https://app.example.com,http://localhost:3000) */
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
    SIGNED_URL_SECRET: z.string().min(32),
    GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(500),
    GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    SLOW_QUERY_THRESHOLD_MS: z.coerce.number().int().positive().default(300),
    /** Local VPS disk only — S3 is not supported */
    STORAGE_DRIVER: z.enum(["local"]).default("local"),
    STORAGE_LOCAL_ROOT: z.string().default("./storage-data"),
    /** When false, subscriptions/billing UI is disabled (free tier). Default off for V1. */
    BILLING_ENABLED: z.coerce.boolean().default(false),
    REFRESH_COOKIE_NAME: z.string().min(1).default("dms_refresh"),
    ADMIN_REFRESH_COOKIE_NAME: z.string().min(1).default("dms_admin_refresh"),
    /** Defaults to true when NODE_ENV is production */
    COOKIE_SECURE: z.coerce.boolean().optional(),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    COOKIE_PATH: z.string().default("/"),
    COOKIE_DOMAIN: z.string().optional(),
    REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(7),
  })
  .superRefine((data, ctx) => {
    const secure = data.COOKIE_SECURE ?? data.NODE_ENV === "production";
    if (data.COOKIE_SAME_SITE === "none" && !secure) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "COOKIE_SAME_SITE=none requires COOKIE_SECURE=true (or NODE_ENV=production with default secure cookies)",
        path: ["COOKIE_SAME_SITE"],
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

const base = parsed.data;

export const env = {
  ...base,
  COOKIE_SECURE: base.COOKIE_SECURE ?? base.NODE_ENV === "production",
  COOKIE_SAME_SITE: base.COOKIE_SAME_SITE,
  REFRESH_COOKIE_MAX_AGE_MS: base.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  SMTP_PASS: base.SMTP_PASS ?? base.SMTP_PASSWORD,
  SMTP_SECURE: base.SMTP_SECURE ?? false,
  CONTACT_INQUIRY_TO: base.CONTACT_INQUIRY_TO ?? "info@tensaedev.com",
  /** Normalized origin list for CORS */
  CORS_ORIGINS: (() => {
    const list = base.CORS_ORIGIN.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length ? list : ["http://localhost:3000"];
  })(),
};
