import type { NextFunction, Request, Response } from "express";

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const roleCode = (req as Request & { auth?: { roleCode?: string } }).auth?.roleCode;
    if (!roleCode || !allowedRoles.includes(roleCode)) {
      res.status(403).json({ message: "Insufficient role privileges" });
      return;
    }
    next();
  };
}
