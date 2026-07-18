import { Router } from "express";
import { authController } from "./controllers/auth.controller.js";
import { authRateLimiter } from "../../common/middleware/rate-limit.middleware.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";

export const authRoutes = Router();

/**
 * @openapi
 * /api/v1/auth/tenants:
 *   get:
 *     tags: [Auth]
 *     summary: List tenants for an email
 */
authRoutes.get("/tenants", authRateLimiter, authController.listTenants);

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register tenant and owner account
 */
authRoutes.post("/register", authRateLimiter, authController.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login into a tenant workspace
 */
authRoutes.post("/login", authRateLimiter, authController.login);
authRoutes.post("/refresh", authRateLimiter, authController.refresh);
authRoutes.post("/logout", authRateLimiter, authController.logout);
authRoutes.post("/forgot-password", authRateLimiter, authController.forgotPassword);
authRoutes.post("/reset-password", authRateLimiter, authController.resetPassword);
authRoutes.post("/recovery-login", authRateLimiter, authController.recoveryLogin);
authRoutes.post("/2fa/setup", authRateLimiter, authMiddleware, authController.setupTwoFactor);
authRoutes.post("/2fa/verify", authRateLimiter, authMiddleware, authController.verifyTwoFactor);
authRoutes.post("/2fa/disable", authRateLimiter, authMiddleware, authController.disableTwoFactor);
authRoutes.post("/invites/accept", authRateLimiter, authController.acceptInvite);
