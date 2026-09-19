import { env } from "../../config/env.js";
/** Browser app origin for invite/reset/share links. */
export function publicAppBaseUrl(fallback) {
    const configured = env.PUBLIC_APP_BASE_URL?.replace(/\/$/, "").trim();
    if (configured)
        return configured;
    return (fallback ?? "http://localhost:3000").replace(/\/$/, "");
}
/** Public API origin (no /api/v1) for signed download URLs. */
export function publicApiBaseUrl(fallback) {
    const configured = env.PUBLIC_API_BASE_URL?.replace(/\/$/, "").trim();
    if (configured)
        return configured;
    const app = env.PUBLIC_APP_BASE_URL?.replace(/\/$/, "").trim();
    if (app)
        return app;
    return (fallback ?? "http://localhost:4000").replace(/\/$/, "");
}
