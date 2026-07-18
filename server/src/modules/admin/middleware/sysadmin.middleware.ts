import type { NextFunction, Request, Response } from "express";
import type { AccessTokenPayload } from "../../../common/middleware/auth.middleware.js";

export function requireSysAdmin(req: Request, res: Response, next: NextFunction): void {
  const payload = (req as Request & { auth?: AccessTokenPayload }).auth;
  if (!payload || payload.roleCode !== "SYS_ADMIN") {
    res.status(403).json({ message: "Insufficient role privileges" });
    return;
  }
  next();
}

