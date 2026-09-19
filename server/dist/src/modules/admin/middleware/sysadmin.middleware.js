import { SYSADMIN_ROLE_CODE, SYSADMIN_TENANT_ID } from "../admin.constants.js";
import { ADMIN_ACCESS_JWT_TYP } from "../services/admin-auth.service.js";
export function requireSysAdmin(req, res, next) {
    const payload = req.auth;
    const isPlatformAdmin = !!payload &&
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
