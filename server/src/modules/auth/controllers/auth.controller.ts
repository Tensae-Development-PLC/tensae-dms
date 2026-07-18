import type { Request, Response } from "express";
import { forgotPasswordSchema, loginSchema, recoveryCodeLoginSchema, registerSchema, resetPasswordSchema, setupTwoFactorSchema, verifyTwoFactorSchema, acceptInviteSchema } from "../dto/auth.dto.js";
import { authService } from "../services/auth.service.js";
import { auditService } from "../../audit/services/audit.service.js";
import { env } from "../../../config/env.js";
import { clearAuthCookie, tenantRefreshCookieOptions } from "../../../common/utils/auth-cookies.js";
import { AppError } from "../../../common/utils/app-error.js";

export const authController = {
  async listTenants(req: Request, res: Response) {
    const email = String(req.query.email ?? "").trim();
    if (!email) return res.status(400).json({ message: "email is required" });
    const tenants = await authService.listTenantsByEmail(email);
    res.status(200).json({ tenants });
  },
  async register(req: Request, res: Response) {
    const dto = registerSchema.parse(req.body);
    const data = await authService.register(dto);
    res.status(201).json(data);
  },
  async login(req: Request, res: Response) {
    const dto = loginSchema.parse(req.body);
    try {
      const tokens = await authService.login(dto);
      res.cookie(env.REFRESH_COOKIE_NAME, tokens.refreshToken, tenantRefreshCookieOptions());
      res.status(200).json({ accessToken: tokens.accessToken });
    } catch (err) {
      const ip = req.ip ?? "";
      const userAgent = String(req.headers["user-agent"] ?? "");
      // best-effort: log failed attempt without leaking whether user exists
      await auditService.log({
        tenantId: dto.tenantId,
        action: "auth.login.failed",
        entity: "user",
        metadata: { email: dto.email.toLowerCase(), ip, userAgent },
      });
      throw err;
    }
  },
  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new AppError(401, "Missing refresh session");
    }
    const tokens = await authService.refresh({ refreshToken });
    res.cookie(env.REFRESH_COOKIE_NAME, tokens.refreshToken, tenantRefreshCookieOptions());
    res.status(200).json({ accessToken: tokens.accessToken });
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // still clear cookie — session may already be revoked
      }
    }
    clearAuthCookie(res, env.REFRESH_COOKIE_NAME);
    res.status(204).send();
  },
  async forgotPassword(req: Request, res: Response) {
    const dto = forgotPasswordSchema.parse(req.body);
    const response = await authService.forgotPassword(dto);
    res.status(202).json(response);
  },
  async resetPassword(req: Request, res: Response) {
    const dto = resetPasswordSchema.parse(req.body);
    const response = await authService.resetPassword(dto);
    res.status(200).json(response);
  },
  async setupTwoFactor(req: Request, res: Response) {
    const dto = setupTwoFactorSchema.parse(req.body);
    const userId = req.requestContext?.userId ?? "";
    res.status(200).json(await authService.setupTwoFactor(userId, dto));
  },
  async verifyTwoFactor(req: Request, res: Response) {
    const dto = verifyTwoFactorSchema.parse(req.body);
    const userId = req.requestContext?.userId ?? "";
    res.status(200).json(await authService.verifyTwoFactor(userId, dto));
  },
  async disableTwoFactor(req: Request, res: Response) {
    const tenantId = req.requestContext?.tenantId ?? "";
    const userId = req.requestContext?.userId ?? "";
    res.status(200).json(await authService.disableTwoFactor(userId, tenantId));
  },
  async recoveryLogin(req: Request, res: Response) {
    const dto = recoveryCodeLoginSchema.parse(req.body);
    const tokens = await authService.loginWithRecoveryCode(dto);
    res.cookie(env.REFRESH_COOKIE_NAME, tokens.refreshToken, tenantRefreshCookieOptions());
    res.status(200).json({ accessToken: tokens.accessToken });
  },
  async acceptInvite(req: Request, res: Response) {
    const dto = acceptInviteSchema.parse(req.body);
    const result = await authService.acceptInvite(dto);
    res.status(201).json(result);
  },
};
