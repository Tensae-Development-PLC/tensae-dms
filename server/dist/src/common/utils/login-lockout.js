/** In-memory failed-login lockout (per process). Good enough for single-node VPS. */
const failures = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
function key(email, tenantId) {
    return `${tenantId}:${email.toLowerCase()}`;
}
export function assertNotLockedOut(email, tenantId) {
    const entry = failures.get(key(email, tenantId));
    if (!entry?.lockedUntil)
        return;
    if (Date.now() < entry.lockedUntil) {
        const err = new Error("ACCOUNT_LOCKED");
        throw err;
    }
    failures.delete(key(email, tenantId));
}
export function recordLoginFailure(email, tenantId) {
    const k = key(email, tenantId);
    const entry = failures.get(k) ?? { count: 0 };
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
        entry.lockedUntil = Date.now() + LOCK_MS;
    }
    failures.set(k, entry);
    // Expire soft entries after window
    setTimeout(() => {
        const cur = failures.get(k);
        if (cur && !cur.lockedUntil)
            failures.delete(k);
    }, WINDOW_MS).unref?.();
}
export function clearLoginFailures(email, tenantId) {
    failures.delete(key(email, tenantId));
}
