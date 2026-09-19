import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";
import { AppError } from "../../../common/utils/app-error.js";
import { SYSADMIN_ROLE_CODE, SYSADMIN_TENANT_ID } from "../admin.constants.js";
import { auditService } from "../../audit/services/audit.service.js";
export const ADMIN_REFRESH_JWT_TYP = "admin_rt";
export const ADMIN_ACCESS_JWT_TYP = "admin_at";
function signAccessToken(payload) {
    return jwt.sign({ ...payload, typ: ADMIN_ACCESS_JWT_TYP }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}
function safeEqual(a, b) {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    if (aa.length !== bb.length)
        return false;
    return crypto.timingSafeEqual(aa, bb);
}
export const adminAuthService = {
    async login(dto, context) {
        const configuredEmail = env.SYSADMIN_EMAIL;
        const configuredPassword = env.SYSADMIN_PASSWORD;
        if (!configuredEmail || !configuredPassword) {
            throw new AppError(503, "Admin login is not configured");
        }
        const ok = safeEqual(dto.email.toLowerCase(), configuredEmail.toLowerCase()) && safeEqual(dto.password, configuredPassword);
        if (!ok) {
            await auditService.log({
                action: "admin.auth.login.failed",
                entity: "sysadmin",
                metadata: { email: dto.email.toLowerCase(), ip: context.ip, userAgent: context.userAgent },
            });
            throw new AppError(401, "Invalid credentials");
        }
        await auditService.log({
            action: "admin.auth.login",
            entity: "sysadmin",
            metadata: { email: dto.email.toLowerCase(), ip: context.ip, userAgent: context.userAgent },
        });
        const payload = { sub: "sysadmin", tenantId: SYSADMIN_TENANT_ID, roleCode: SYSADMIN_ROLE_CODE };
        const accessToken = signAccessToken(payload);
        const refreshToken = jwt.sign({ typ: ADMIN_REFRESH_JWT_TYP, sub: "sysadmin" }, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TOKEN_DAYS}d` });
        return { accessToken, refreshToken };
    },
    rotateRefresh() {
        const payload = { sub: "sysadmin", tenantId: SYSADMIN_TENANT_ID, roleCode: SYSADMIN_ROLE_CODE };
        const accessToken = signAccessToken(payload);
        const refreshToken = jwt.sign({ typ: ADMIN_REFRESH_JWT_TYP, sub: "sysadmin" }, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TOKEN_DAYS}d` });
        return { accessToken, refreshToken };
    },
};
