import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { env } from "../../../config/env.js";
import type { ForgotPasswordDto, LoginDto, RecoveryCodeLoginDto, RefreshDto, RegisterDto, ResetPasswordDto, SetupTwoFactorDto, VerifyTwoFactorDto, AcceptInviteDto } from "../dto/auth.dto.js";
import { authRepository } from "../repositories/auth.repository.js";
import { auditService } from "../../audit/services/audit.service.js";
import { AppError } from "../../../common/utils/app-error.js";
import { jobDispatcher } from "../../../jobs/services/job-dispatcher.service.js";
import { publicAppBaseUrl } from "../../../common/utils/public-urls.js";

function signAccessToken(payload: { sub: string; tenantId: string; roleCode: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshExpiryDate(sessionTimeoutMinutes?: number | null) {
  const maxMs = env.REFRESH_TOKEN_DAYS * 24 * 3600 * 1000;
  const timeoutMs =
    typeof sessionTimeoutMinutes === "number" && sessionTimeoutMinutes > 0
      ? sessionTimeoutMinutes * 60 * 1000
      : maxMs;
  return new Date(Date.now() + Math.min(maxMs, timeoutMs));
}

export const authService = {
  async listTenantsByEmail(email: string) {
    const rows = await authRepository.listTenantsForEmail(email.toLowerCase());
    return rows
      .map((r) => r.tenant)
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        tenantId: t.id,
        tenantName: t.name,
        slug: t.slug,
        companyName: t.company?.legalName ?? t.name,
      }));
  },
  async register(dto: RegisterDto) {
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

  async login(dto: LoginDto) {
    const { assertNotLockedOut, recordLoginFailure, clearLoginFailures } = await import("../../../common/utils/login-lockout.js");
    try {
      assertNotLockedOut(dto.email, dto.tenantId);
    } catch {
      throw new AppError(429, "Too many failed login attempts. Try again in 15 minutes.");
    }

    const user = await authRepository.findUserByEmailWithinTenant(dto.email.toLowerCase(), dto.tenantId);
    if (!user) {
      recordLoginFailure(dto.email, dto.tenantId);
      throw new AppError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      recordLoginFailure(dto.email, dto.tenantId);
      await auditService.log({
        tenantId: user.tenantId,
        actorUserId: user.id,
        action: "auth.login.failed",
        entity: "user",
        entityId: user.id,
      });
      throw new AppError(401, "Invalid credentials");
    }

    clearLoginFailures(dto.email, dto.tenantId);

    const payload = { sub: user.id, tenantId: user.tenantId, roleCode: user.role.code };
    const accessToken = signAccessToken(payload);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    await authRepository.createRefreshToken(
      user.id,
      hashToken(refreshToken),
      refreshExpiryDate(user.profileSecurity?.sessionTimeoutMinutes),
    );

    await auditService.log({
      tenantId: user.tenantId,
      actorUserId: user.id,
      action: "auth.login",
      entity: "user",
      entityId: user.id,
    });

    return { accessToken, refreshToken };
  },

  async refresh(dto: RefreshDto) {
    const tokenHash = hashToken(dto.refreshToken);
    const session = await authRepository.findValidRefreshToken(tokenHash);
    if (!session) {
      throw new AppError(401, "Invalid refresh token");
    }
    await authRepository.revokeRefreshToken(tokenHash);
    const payload = { sub: session.user.id, tenantId: session.user.tenantId, roleCode: session.user.role.code };
    const accessToken = signAccessToken(payload);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    // Keep absolute session end from the previous refresh token (session timeout)
    await authRepository.createRefreshToken(session.user.id, hashToken(refreshToken), session.expiresAt);
    return { accessToken, refreshToken };
  },

  async logout(refreshTokenPlain: string) {
    const tokenHash = hashToken(refreshTokenPlain);
    await authRepository.revokeRefreshToken(tokenHash);
  },

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await authRepository.findUserByEmailWithinTenant(dto.email.toLowerCase(), dto.tenantId);
    if (!user) {
      return { accepted: true };
    }
    const token = crypto.randomBytes(32).toString("hex");
    await authRepository.createPasswordResetToken(user.id, hashToken(token), new Date(Date.now() + 30 * 60 * 1000));
    await jobDispatcher.enqueueEmail({
      tenantId: user.tenantId,
      userId: user.id,
      template: "password-reset",
      resetToken: token,
      email: user.email,
      resetUrl: `${publicAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`,
    });
    await auditService.log({ tenantId: user.tenantId, actorUserId: user.id, action: "auth.password.forgot", entity: "user", entityId: user.id });
    // Never return the reset token in the API response — email only.
    return { accepted: true };
  },

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const reset = await authRepository.findValidPasswordResetToken(tokenHash);
    if (!reset) {
      throw new AppError(400, "Invalid or expired reset token");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await authRepository.updateUserPassword(reset.userId, passwordHash);
    await authRepository.markPasswordResetTokenUsed(reset.id);
    await auditService.log({ tenantId: reset.user.tenantId, actorUserId: reset.userId, action: "auth.password.reset", entity: "user", entityId: reset.userId });
    return { updated: true };
  },

  async setupTwoFactor(userId: string, dto: SetupTwoFactorDto) {
    const user = await authRepository.findUserById(userId);
    if (!user || user.tenantId !== dto.tenantId) throw new AppError(404, "User not found");
    const secret = speakeasy.generateSecret({ name: `DMS (${user.email})` });
    const otpAuth = secret.otpauth_url ?? "";
    const qrDataUrl = await QRCode.toDataURL(otpAuth);
    await authRepository.upsertUserSecurity(userId, { twoFactorPendingSecret: secret.base32 });
    return { secret: secret.base32, otpAuth, qrDataUrl };
  },

  async verifyTwoFactor(userId: string, dto: VerifyTwoFactorDto) {
    const user = await authRepository.findUserById(userId);
    if (!user || user.tenantId !== dto.tenantId) throw new AppError(404, "User not found");
    const pendingSecret = user.profileSecurity?.twoFactorPendingSecret;
    if (!pendingSecret || !speakeasy.totp.verify({ token: dto.code, secret: pendingSecret, encoding: "base32" })) {
      throw new AppError(400, "Invalid TOTP code");
    }
    const recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(6).toString("hex"));
    const recoveryCodesHash = crypto.createHash("sha256").update(recoveryCodes.join("|")).digest("hex");
    await authRepository.upsertUserSecurity(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: pendingSecret,
      twoFactorPendingSecret: null,
      recoveryCodesHash,
    });
    return { enabled: true, recoveryCodes };
  },

  async disableTwoFactor(userId: string, tenantId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user || user.tenantId !== tenantId) throw new AppError(404, "User not found");
    await authRepository.upsertUserSecurity(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorPendingSecret: null,
      recoveryCodesHash: null,
    });
    return { disabled: true };
  },

  async loginWithRecoveryCode(dto: RecoveryCodeLoginDto) {
    const user = await authRepository.findUserByEmailWithinTenant(dto.email.toLowerCase(), dto.tenantId);
    if (!user || !user.profileSecurity?.recoveryCodesHash) throw new AppError(401, "Invalid recovery code");
    const digest = crypto.createHash("sha256").update(dto.recoveryCode).digest("hex");
    if (digest !== user.profileSecurity.recoveryCodesHash) throw new AppError(401, "Invalid recovery code");
    await authRepository.upsertUserSecurity(user.id, { recoveryCodesHash: null });
    const payload = { sub: user.id, tenantId: user.tenantId, roleCode: user.role.code };
    const accessToken = signAccessToken(payload);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    await authRepository.createRefreshToken(user.id, hashToken(refreshToken), refreshExpiryDate());
    return { accessToken, refreshToken };
  },

  async acceptInvite(dto: { token: string; email: string; fullName: string; password: string }) {
    // Find invite by token and email
    const invite = await authRepository.findInviteByTokenAndEmail(dto.token, dto.email.toLowerCase());
    if (!invite) {
      throw new AppError(404, "Invitation not found or has expired");
    }
    if (new Date() > invite.expiresAt) {
      throw new AppError(410, "Invitation has expired");
    }
    if (invite.acceptedAt) {
      throw new AppError(409, "Invitation has already been accepted");
    }

    // Check if user already exists
    const existingUser = await authRepository.findUserByEmailWithinTenant(dto.email.toLowerCase(), invite.tenantId);
    if (existingUser) {
      throw new AppError(409, "User already exists in this workspace");
    }

    // Create user account
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await authRepository.createUserInTenant({
      tenantId: invite.tenantId,
      roleId: invite.roleId,
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    // Mark invite as accepted
    await authRepository.markInviteAccepted(invite.id);

    // Create team member entry
    await authRepository.createTeamMember(invite.tenantId, user.id, user.id);

    // Log audit event
    await auditService.log({
      tenantId: invite.tenantId,
      actorUserId: user.id,
      action: "auth.invite.accept",
      entity: "user",
      entityId: user.id,
    });

    const payload = { sub: user.id, tenantId: invite.tenantId, roleCode: user.role.code };
    const accessToken = signAccessToken(payload);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    await authRepository.createRefreshToken(user.id, hashToken(refreshToken), refreshExpiryDate());

    return {
      userId: user.id,
      tenantId: invite.tenantId,
      roleId: invite.roleId,
      accessToken,
      refreshToken,
    };
  },
};

