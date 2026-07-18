import crypto from "node:crypto";
import { auditService } from "../../audit/services/audit.service.js";
import { clientRepository } from "../repositories/client.repository.js";
import { AppError } from "../../../common/utils/app-error.js";
import { jobDispatcher } from "../../../jobs/services/job-dispatcher.service.js";
import { storageService } from "../../../storage/storage.service.js";

export const clientService = {
  createFolder: clientRepository.createFolder,
  listFolders: clientRepository.listFolders,
  listDocuments(tenantId: string, opts?: { folderId?: string; unfiled?: boolean }) {
    return clientRepository.listDocuments(tenantId, opts);
  },
  listSharedLinks: clientRepository.listSharedLinks,
  listWorkflows: clientRepository.listWorkflows,
  async listTeamMembers(tenantId: string) {
    const members = await clientRepository.listTeamMembers(tenantId);
    const users = await clientRepository.listUsersByIds(
      tenantId,
      members.map((m) => m.userId),
    );
    const usersById = new Map(users.map((u) => [u.id, u]));
    return members.map((member) => ({
      ...member,
      user: usersById.get(member.userId) ?? null,
    }));
  },
  listRoles: clientRepository.listRoles,
  getRoleById: clientRepository.getRoleById,
  listApiKeys: clientRepository.listApiKeys,
  getSettings: clientRepository.getSettings,
  getTenantQuota: clientRepository.getTenantQuota,
  listNotifications: clientRepository.listNotifications,
  listFavorites: clientRepository.listFavorites,
  listAuditLogs: clientRepository.listAuditLogs,
  findDocumentByIdForTenant: clientRepository.findDocumentByIdForTenant,

  async shareDocument(tenantId: string, actorUserId: string, input: { documentId: string; expiresAt?: string; allowDownload: boolean }) {
    const share = await clientRepository.createSharedLink(tenantId, {
      documentId: input.documentId,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      allowDownload: input.allowDownload,
    });
    await auditService.log({ tenantId, actorUserId, action: "document.share", entity: "shared_link", entityId: share.id });
    return share;
  },
  async createDocument(tenantId: string, userId: string, input: { name: string; mimeType: string; sizeBytes: bigint; storageKey: string; folderId?: string }) {
    const quota = await clientRepository.getTenantQuota(tenantId);
    if (quota) {
      const deltaMb = Math.max(1, Math.ceil(Number(input.sizeBytes) / (1024 * 1024)));
      if (quota.storageUsedMb + deltaMb > quota.storageLimitMb) {
        throw new AppError(409, "Storage quota exceeded");
      }
      await clientRepository.incrementQuotaUsage(tenantId, deltaMb);
    }
    const document = await clientRepository.createDocument(tenantId, userId, input);
    await auditService.log({ tenantId, actorUserId: userId, action: "document.create", entity: "document", entityId: document.id });
    return document;
  },

  async deleteDocument(tenantId: string, actorUserId: string, documentId: string) {
    const document = await clientRepository.findDocumentByIdForTenant(documentId, tenantId);
    if (!document) {
      throw new AppError(404, "Document not found");
    }
    await clientRepository.deleteDocument(tenantId, documentId);
    await storageService.delete(document.storageKey);
    const deltaMb = Math.max(1, Math.ceil(Number(document.sizeBytes) / (1024 * 1024)));
    const quota = await clientRepository.getTenantQuota(tenantId);
    if (quota && quota.storageUsedMb > 0) {
      await clientRepository.decrementQuotaUsage(tenantId, Math.min(deltaMb, quota.storageUsedMb));
    }
    await auditService.log({ tenantId, actorUserId, action: "document.delete", entity: "document", entityId: documentId });
    return { deleted: true };
  },

  async renameDocument(tenantId: string, actorUserId: string, documentId: string, name: string) {
    const document = await clientRepository.findDocumentByIdForTenant(documentId, tenantId);
    if (!document) {
      throw new AppError(404, "Document not found");
    }
    await clientRepository.renameDocument(tenantId, documentId, name);
    await auditService.log({ tenantId, actorUserId, action: "document.rename", entity: "document", entityId: documentId });
    return { ...document, name };
  },

  async resolveSharedLink(token: string) {
    const link = await clientRepository.findSharedLinkByToken(token);
    if (!link) throw new AppError(404, "Shared link not found");
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new AppError(410, "Shared link has expired");
    }
    return {
      token: link.token,
      allowDownload: link.allowDownload,
      expiresAt: link.expiresAt,
      document: {
        id: link.document.id,
        name: link.document.name,
        mimeType: link.document.mimeType,
        sizeBytes: String(link.document.sizeBytes),
        createdAt: link.document.createdAt,
      },
    };
  },

  async getSharedLinkForDownload(token: string) {
    const link = await clientRepository.findSharedLinkByToken(token);
    if (!link) throw new AppError(404, "Shared link not found");
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new AppError(410, "Shared link has expired");
    }
    return { document: link.document, allowDownload: link.allowDownload };
  },

  async favoriteDocument(tenantId: string, userId: string, documentId: string) {
    return clientRepository.addFavorite(tenantId, userId, documentId);
  },

  async createWorkflow(tenantId: string, actorUserId: string, input: { name: string; definition: string }) {
    const workflow = await clientRepository.createWorkflow(tenantId, input);
    await auditService.log({ tenantId, actorUserId, action: "workflow.create", entity: "workflow", entityId: workflow.id });
    await jobDispatcher.enqueueWorkflowReminder({ tenantId, workflowId: workflow.id });
    return workflow;
  },

  async notify(tenantId: string, actorUserId: string, input: { userId: string; title: string; body: string }) {
    const notification = await clientRepository.createNotification(tenantId, input);
    await auditService.log({ tenantId, actorUserId, action: "notification.create", entity: "notification", entityId: notification.id });
    await jobDispatcher.enqueueNotification({ tenantId, notificationId: notification.id, userId: input.userId });
    return notification;
  },

  async inviteMember(tenantId: string, actorUserId: string, userId: string) {
    const member = await clientRepository.inviteTeamMember(tenantId, userId, actorUserId);
    await auditService.log({ tenantId, actorUserId, action: "team.invite", entity: "team_member", entityId: member.id });
    return member;
  },

  async updateSettings(tenantId: string, actorUserId: string, input: { timezone?: string; twoFactorRequired?: boolean; retentionDays?: number }) {
    const setting = await clientRepository.updateSettings(tenantId, input);
    await auditService.log({ tenantId, actorUserId, action: "settings.update", entity: "tenant_setting", entityId: setting.id });
    return setting;
  },

  async createApiKey(tenantId: string, actorUserId: string, input: { name: string; expiresAt?: string }) {
    const rawKey = `dms_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const apiKey = await clientRepository.createApiKey(tenantId, { name: input.name, keyHash, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined });
    await auditService.log({ tenantId, actorUserId, action: "api_key.create", entity: "api_key", entityId: apiKey.id });
    return { ...apiKey, rawKey };
  },

  async deleteApiKey(tenantId: string, actorUserId: string, apiKeyId: string) {
    const apiKey = await clientRepository.deleteApiKey(tenantId, apiKeyId);
    await auditService.log({ tenantId, actorUserId, action: "api_key.delete", entity: "api_key", entityId: apiKeyId });
    return apiKey;
  },

  async updateProfileSecurity(userId: string, tenantId: string, input: { twoFactorEnabled?: boolean; twoFactorSecret?: string }) {
    const security = await clientRepository.updateProfileSecurity(userId, input);
    await auditService.log({ tenantId, actorUserId: userId, action: "profile.security.update", entity: "user_security", entityId: security.id });
    return security;
  },
};
