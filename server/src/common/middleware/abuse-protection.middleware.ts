import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { env } from "../../config/env.js";

export const globalRateLimiter = rateLimit({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  max: env.GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

export const abuseSlowDown = slowDown({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  delayAfter: Math.floor(env.GLOBAL_RATE_LIMIT_MAX * 0.4),
  delayMs: () => 250,
});
