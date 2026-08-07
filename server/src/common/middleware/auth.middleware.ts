import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  tenantId: string;
  roleCode: string;
  typ?: string;
};

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Missing access token" });
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
