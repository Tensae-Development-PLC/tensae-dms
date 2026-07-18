import type { CookieOptions, Response } from "express";
import { env } from "../../config/env.js";

export function tenantRefreshCookieOptions(): CookieOptions {
  const opts: CookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: env.REFRESH_COOKIE_MAX_AGE_MS,
    path: env.COOKIE_PATH,
  };
  if (env.COOKIE_DOMAIN) opts.domain = env.COOKIE_DOMAIN;
  return opts;
}

export function adminRefreshCookieOptions(): CookieOptions {
  return tenantRefreshCookieOptions();
}

/** Options must match those used when the cookie was set. */
export function clearAuthCookie(res: Response, name: string) {
  const opts: CookieOptions = {
    path: env.COOKIE_PATH,
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: 0,
  };
  if (env.COOKIE_DOMAIN) opts.domain = env.COOKIE_DOMAIN;
  res.clearCookie(name, opts);
}
