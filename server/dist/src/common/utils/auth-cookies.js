import { env } from "../../config/env.js";
export function tenantRefreshCookieOptions() {
    const opts = {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        maxAge: env.REFRESH_COOKIE_MAX_AGE_MS,
        path: env.COOKIE_PATH,
    };
    if (env.COOKIE_DOMAIN)
        opts.domain = env.COOKIE_DOMAIN;
    return opts;
}
export function adminRefreshCookieOptions() {
    return tenantRefreshCookieOptions();
}
/** Options must match those used when the cookie was set. */
export function clearAuthCookie(res, name) {
    const opts = {
        path: env.COOKIE_PATH,
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        maxAge: 0,
    };
    if (env.COOKIE_DOMAIN)
        opts.domain = env.COOKIE_DOMAIN;
    res.clearCookie(name, opts);
}
