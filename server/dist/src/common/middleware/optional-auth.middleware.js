import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
/** Runs JWT auth when `Authorization: Bearer` is present; otherwise continues without user context. */
export function optionalAuthMiddleware(req, res, next) {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
        next();
        return;
    }
    try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
        req.requestContext = {
            ...(req.requestContext ?? { requestId: "unknown" }),
            userId: payload.sub,
            tenantId: payload.tenantId,
        };
        req.auth = payload;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}
