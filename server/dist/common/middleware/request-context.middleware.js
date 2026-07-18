import crypto from "node:crypto";
export function requestContextMiddleware(req, _res, next) {
    const requestId = req.header("x-request-id") ?? crypto.randomUUID();
    const tenantId = req.header("x-tenant-id") ?? undefined;
    req.requestContext = { requestId, tenantId };
    next();
}
