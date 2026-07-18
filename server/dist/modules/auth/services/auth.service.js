import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";
import { authRepository } from "../repositories/auth.repository.js";
import { auditService } from "../../audit/services/audit.service.js";
export const authService = {
    async register(dto) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const created = await authRepository.createTenantWithOwner({
            tenantName: dto.tenantName,
            companyName: dto.companyName,
            fullName: dto.fullName,
            email: dto.email.toLowerCase(),
            passwordHash,
        });
        await auditService.log({
            tenantId: created.tenant.id,
            actorUserId: created.user.id,
            action: "auth.register",
            entity: "user",
            entityId: created.user.id,
        });
        return {
            tenantId: created.tenant.id,
            userId: created.user.id,
            roleCode: created.role.code,
        };
    },
    async login(dto) {
        const user = await authRepository.findUserByEmailWithinTenant(dto.email.toLowerCase(), dto.tenantId);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new Error("Invalid credentials");
        }
        const payload = { sub: user.id, tenantId: user.tenantId, roleCode: user.role.code };
        const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
        await auditService.log({
            tenantId: user.tenantId,
            actorUserId: user.id,
            action: "auth.login",
            entity: "user",
            entityId: user.id,
        });
        return { accessToken, refreshToken };
    },
};
