import type { NextFunction, Request, Response } from "express";
import type { AccessTokenPayload } from "../../../common/middleware/auth.middleware.js";
import { SYSADMIN_ROLE_CODE, SYSADMIN_TENANT_ID } from "../admin.constants.js";
import { ADMIN_ACCESS_JWT_TYP } from "../services/admin-auth.service.js";

type AdminAccessPayload = AccessTokenPayload & { typ?: string };

export function requireSysAdmin(req: Request, res: Response, next: NextFunction): void {
  const payload = (req as Request & { auth?: AdminAccessPayload }).auth;
  const isPlatformAdmin =
    !!payload &&
    payload.roleCode === SYSADMIN_ROLE_CODE &&
    payload.tenantId === SYSADMIN_TENANT_ID &&
    payload.sub === "sysadmin" &&
    payload.typ === ADMIN_ACCESS_JWT_TYP;

  if (!isPlatformAdmin) {
    res.status(403).json({ message: "Insufficient role privileges" });
    return;
  }
  next();
}
