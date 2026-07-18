import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

declare global {
  namespace Express {
    interface Request {
      requestContext?: {
        requestId: string;
        tenantId?: string;
        userId?: string;
      };
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header("x-request-id") ?? crypto.randomUUID();
  const tenantId = req.header("x-tenant-id") ?? undefined;

  req.requestContext = { requestId, tenantId };
  res.setHeader("x-request-id", requestId);
  next();
}
