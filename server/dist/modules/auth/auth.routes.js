import { Router } from "express";
import { authController } from "./controllers/auth.controller.js";
export const authRoutes = Router();
/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register tenant and owner account
 */
authRoutes.post("/register", authController.register);
/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login into a tenant workspace
 */
authRoutes.post("/login", authController.login);
