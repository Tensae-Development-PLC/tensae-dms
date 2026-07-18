import type { NextFunction, Request, Response } from "express";

export function tenantBoundaryMiddleware(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.requestContext?.tenantId;
  if (!tenantId) {
    res.status(400).json({ message: "Missing tenant context" });
    return;
  }
  next();
}
