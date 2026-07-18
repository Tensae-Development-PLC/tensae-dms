import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { requireRole } from "../../common/middleware/rbac.middleware.js";
import { rbacController } from "./controllers/rbac.controller.js";

export const rbacRoutes = Router();

/**
 * @openapi
 * /api/v1/rbac/roles:
 *   get:
 *     tags: [RBAC]
 *     summary: List roles for active tenant
 */
rbacRoutes.get("/roles", authMiddleware, requireRole(["TENANT_OWNER", "ADMIN"]), rbacController.listRoles);
