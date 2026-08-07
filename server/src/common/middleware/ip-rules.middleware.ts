import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/prisma.js";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip || req.socket.remoteAddress || "";
}

/**
 * Enforce GlobalIpRule: blocked IPs always denied; if any WHITELIST rules exist, only those IPs pass.
 */
export async function ipRulesMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = clientIp(req);
    if (!ip) {
      next();
      return;
    }

    const blocked = await prisma.globalIpRule.findFirst({
      where: { type: "BLOCK", value: ip },
    });
    if (blocked) {
      res.status(403).json({ message: "Access denied from this IP" });
      return;
    }

    const whitelistCount = await prisma.globalIpRule.count({ where: { type: "WHITELIST" } });
    if (whitelistCount > 0) {
      const allowed = await prisma.globalIpRule.findFirst({
        where: { type: "WHITELIST", value: ip },
      });
      if (!allowed) {
        res.status(403).json({ message: "IP not on allowlist" });
        return;
      }
    }

    next();
  } catch {
    next();
  }
}
