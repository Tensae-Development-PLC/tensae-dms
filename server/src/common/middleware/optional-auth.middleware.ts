import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AccessTokenPayload } from "./auth.middleware.js";

/** Runs JWT auth when `Authorization: Bearer` is present; otherwise continues without user context. */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.requestContext = {
      ...(req.requestContext ?? { requestId: "unknown" }),
      userId: payload.sub,
      tenantId: payload.tenantId,
    };
    (req as Request & { auth?: AccessTokenPayload }).auth = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
