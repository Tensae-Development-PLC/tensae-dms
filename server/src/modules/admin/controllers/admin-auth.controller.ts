import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";
import { AppError } from "../../../common/utils/app-error.js";
import { adminRefreshCookieOptions, clearAuthCookie } from "../../../common/utils/auth-cookies.js";
import { adminLoginSchema } from "../dto/admin-auth.dto.js";
import { ADMIN_REFRESH_JWT_TYP, adminAuthService } from "../services/admin-auth.service.js";

export const adminAuthController = {
  async login(req: Request, res: Response) {
    const dto = adminLoginSchema.parse(req.body);
    const ip = req.ip ?? "";
    const userAgent = String(req.headers["user-agent"] ?? "");
    const tokens = await adminAuthService.login(dto, { ip, userAgent });
    res.cookie(env.ADMIN_REFRESH_COOKIE_NAME, tokens.refreshToken, adminRefreshCookieOptions());
    res.status(200).json({ accessToken: tokens.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const raw = req.cookies?.[env.ADMIN_REFRESH_COOKIE_NAME];
    if (!raw) {
      throw new AppError(401, "Missing admin session");
    }
    try {
      const decoded = jwt.verify(raw, env.JWT_REFRESH_SECRET) as { typ?: string; sub?: string };
      if (decoded.typ !== ADMIN_REFRESH_JWT_TYP || decoded.sub !== "sysadmin") {
        throw new AppError(401, "Invalid admin session");
      }
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(401, "Invalid admin session");
    }
    const tokens = await adminAuthService.rotateRefresh();
    res.cookie(env.ADMIN_REFRESH_COOKIE_NAME, tokens.refreshToken, adminRefreshCookieOptions());
    res.status(200).json({ accessToken: tokens.accessToken });
  },

  async logout(_req: Request, res: Response) {
    clearAuthCookie(res, env.ADMIN_REFRESH_COOKIE_NAME);
    res.status(204).send();
  },
};
