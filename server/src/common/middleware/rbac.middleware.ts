import type { NextFunction, Request, Response } from "express";

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const roleCode = (req as Request & { auth?: { roleCode?: string } }).auth?.roleCode;
    const allowed = new Set(allowedRoles.map((r) => r.toUpperCase()));
    if (!roleCode || !allowed.has(roleCode.toUpperCase())) {
      res.status(403).json({ message: "Insufficient role privileges" });
      return;
    }
    next();
  };
}
