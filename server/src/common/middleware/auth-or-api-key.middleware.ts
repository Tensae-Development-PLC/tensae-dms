import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { AccessTokenPayload } from "./auth.middleware.js";

function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Accepts Bearer JWT or X-Api-Key / Bearer dms_* API keys.
 * API keys authenticate as roleCode API_KEY within their tenant (write-capable for docs).
 */
export async function authOrApiKeyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = req.header("x-api-key")?.trim();
  const authHeader = req.header("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
  const rawKey = apiKeyHeader || (bearer?.startsWith("dms_") ? bearer : undefined);

  if (rawKey) {
    try {
      const keyHash = hashApiKey(rawKey);
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          keyHash,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!apiKey) {
        res.status(401).json({ message: "Invalid API key" });
        return;
      }
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
      const payload: AccessTokenPayload = {
        sub: `apikey:${apiKey.id}`,
        tenantId: apiKey.tenantId,
        roleCode: "API_KEY",
        typ: "api_key",
      };
      req.requestContext = {
        ...(req.requestContext ?? { requestId: "unknown" }),
        userId: payload.sub,
        tenantId: payload.tenantId,
      };
      (req as Request & { auth?: AccessTokenPayload }).auth = payload;
      next();
      return;
    } catch {
      res.status(401).json({ message: "Invalid API key" });
      return;
    }
  }

  if (!bearer) {
    res.status(401).json({ message: "Missing access token" });
    return;
  }

  try {
    const payload = jwt.verify(bearer, env.JWT_ACCESS_SECRET) as AccessTokenPayload & { iat?: number };
    // Enforce per-user session timeout preference against JWT iat (access token lifetime still 15m).
    if (payload.typ !== "api_key" && payload.typ !== "admin_at" && payload.iat && !payload.sub.startsWith("apikey:")) {
      const security = await prisma.userSecurity.findUnique({
        where: { userId: payload.sub },
        select: { sessionTimeoutMinutes: true },
      });
      const timeoutMin = security?.sessionTimeoutMinutes;
      if (typeof timeoutMin === "number" && timeoutMin > 0) {
        const ageMin = (Math.floor(Date.now() / 1000) - payload.iat) / 60;
        if (ageMin > timeoutMin) {
          res.status(401).json({ message: "Session expired" });
          return;
        }
      }
    }
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
