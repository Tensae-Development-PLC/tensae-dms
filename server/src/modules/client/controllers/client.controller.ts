import type { Request, Response } from "express";
import {
  createApiKeySchema,
  createDocumentSchema,
  createFolderSchema,
  createNotificationSchema,
  createShareSchema,
  inviteTeamByEmailSchema,
  createWorkflowSchema,
  inviteTeamSchema,
  updateProfileSecuritySchema,
  updateSettingsSchema,
} from "../dto/client.dto.js";
import { clientService } from "../services/client.service.js";
import { storageService } from "../../../storage/storage.service.js";
import { AppError } from "../../../common/utils/app-error.js";
import { prisma } from "../../../config/prisma.js";
import { issueSignedDownloadToken } from "../../../security/signed-url.service.js";
import { virusScanner } from "../../../security/virus-scanner.js";
import { jobDispatcher } from "../../../jobs/services/job-dispatcher.service.js";
import { env } from "../../../config/env.js";
import { auditService } from "../../audit/services/audit.service.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const context = (req: Request) => ({
  tenantId: req.requestContext?.tenantId ?? "",
  userId: req.requestContext?.userId ?? "",
});

export const clientController = {
  async createFolder(req: Request, res: Response) {
    const dto = createFolderSchema.parse(req.body);
    const ctx = context(req);
    const item = await clientService.createFolder(ctx.tenantId, ctx.userId, dto);
    res.status(201).json(item);
  },
  async listFolders(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.listFolders(tenantId));
  },
  async createDocument(req: Request, res: Response) {
    const dto = createDocumentSchema.parse(req.body);
    const ctx = context(req);
    res.status(201).json(await clientService.createDocument(ctx.tenantId, ctx.userId, dto));
  },
  async uploadDocument(req: Request, res: Response) {
    const ctx = context(req);
    const file = req.file;
    
    if (!file) {
      throw new AppError(400, "No file uploaded");
    }
    
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new AppError(400, "Unsupported file type");
    }

    // Validate quota BEFORE writing to storage
    const quota = await clientService.getTenantQuota(ctx.tenantId);
    if (quota) {
      const deltaMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));
      if (quota.storageUsedMb + deltaMb > quota.storageLimitMb) {
        throw new AppError(409, "Storage quota exceeded");
      }
    }

    // Scan file for viruses
    const scanResult = await virusScanner.scan(file.buffer, { 
      filename: file.originalname, 
      mimeType: file.mimetype 
    });
    
    if (scanResult === "infected") {
      throw new AppError(400, "File rejected by virus scanner");
    }

    // Generate storage key and write file to storage
    const key = `${ctx.tenantId}/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    await storageService.put(key, file.buffer);

    // Create document record with metadata
    const documentInput: any = {
      name: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: BigInt(file.size),
      storageKey: key,
    };

    // Add optional metadata from form fields
    if (req.body.documentType) {
      documentInput.documentType = req.body.documentType;
    }
    if (req.body.entity) {
      documentInput.entity = req.body.entity;
    }
    if (req.body.expiryDate) {
      documentInput.expiryDate = new Date(req.body.expiryDate);
    }

    const item = await clientService.createDocument(ctx.tenantId, ctx.userId, documentInput);
    
    // Enqueue expiry alert job if expiry date is set
    if (req.body.expiryDate) {
      await jobDispatcher.enqueueDocumentExpiryAlert({ 
        tenantId: ctx.tenantId, 
        documentId: item.id, 
        checkAfterHours: 24 
      });
    }

    res.status(201).json(item);
  },
  async signedDownloadUrl(req: Request, res: Response) {
    const ctx = context(req);
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
    const document = await clientService.findDocumentByIdForTenant(documentId, ctx.tenantId);
    if (!document) {
      throw new AppError(404, "Document not found");
    }
    const token = issueSignedDownloadToken({ documentId, tenantId: ctx.tenantId, userId: ctx.userId }, 10 * 60);
    const configured = typeof env.PUBLIC_APP_BASE_URL === "string" ? env.PUBLIC_APP_BASE_URL.replace(/\/$/, "").trim() : "";
    const base = configured || `${req.protocol}://${req.get("host")}`;
    const url = `${base}/api/v1/client/documents/${documentId}/download?token=${encodeURIComponent(token)}`;
    res.json({ url, expiresInSeconds: 600 });
  },
  async streamDownload(req: Request, res: Response) {
    const ctx = context(req);
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
    const document = await clientService.findDocumentByIdForTenant(documentId, ctx.tenantId);
    if (!document) {
      throw new AppError(404, "Document not found");
    }
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${document.name}"`);
    const stream = await storageService.getReadStream(document.storageKey);
    stream.pipe(res);
  },
  async listDocuments(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.listDocuments(tenantId));
  },
  async shareDocument(req: Request, res: Response) {
    const dto = createShareSchema.parse(req.body);
    const ctx = context(req);
    res.status(201).json(await clientService.shareDocument(ctx.tenantId, ctx.userId, dto));
  },
  async listSharedLinks(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.listSharedLinks(tenantId));
  },
  async favoriteDocument(req: Request, res: Response) {
    const { tenantId, userId } = context(req);
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
    res.status(201).json(await clientService.favoriteDocument(tenantId, userId, documentId));
  },
  async listFavorites(req: Request, res: Response) {
    const { tenantId, userId } = context(req);
    res.json(await clientService.listFavorites(tenantId, userId));
  },
  async createWorkflow(req: Request, res: Response) {
    const dto = createWorkflowSchema.parse(req.body);
    const ctx = context(req);
    res.status(201).json(await clientService.createWorkflow(ctx.tenantId, ctx.userId, dto));
  },
  async listWorkflows(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.listWorkflows(tenantId));
  },
  async createNotification(req: Request, res: Response) {
    const dto = createNotificationSchema.parse(req.body);
    const ctx = context(req);
    res.status(201).json(await clientService.notify(ctx.tenantId, ctx.userId, dto));
  },
  async listNotifications(req: Request, res: Response) {
    const { tenantId, userId } = context(req);
    res.json(await clientService.listNotifications(tenantId, userId));
  },
  async inviteMember(req: Request, res: Response) {
    const dto = inviteTeamSchema.parse(req.body);
    const ctx = context(req);
    res.status(201).json(await clientService.inviteMember(ctx.tenantId, ctx.userId, dto.userId));
  },
  async inviteMemberByEmail(req: Request, res: Response) {
    const dto = inviteTeamByEmailSchema.parse(req.body);
    const ctx = context(req);
    const inviter = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { fullName: true, email: true, tenant: { select: { name: true } } },
    });
    if (!inviter) {
      throw new AppError(404, "Inviter not found");
    }

    // Find the role by name/code
    const role = await prisma.role.findFirst({
      where: { tenantId: ctx.tenantId, name: dto.role },
    });
    if (!role) {
      throw new AppError(400, "Invalid role");
    }

    // Generate invite token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update invite record
    await prisma.invite.upsert({
      where: { tenantId_email: { tenantId: ctx.tenantId, email: dto.email } },
      create: { tenantId: ctx.tenantId, email: dto.email, roleId: role.id, token, expiresAt },
      update: { token, expiresAt, acceptedAt: null, roleId: role.id },
    });

    const appBase = env.PUBLIC_APP_BASE_URL ?? `${req.protocol}://${req.get("host")}`;
    const inviteUrl = `${appBase}/invite/accept?email=${encodeURIComponent(dto.email)}&token=${encodeURIComponent(token)}`;

    await jobDispatcher.enqueueEmail({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      template: "team-invite",
      email: dto.email,
      role: dto.role,
      department: dto.department,
      expiryDate: dto.expiryDate,
      companyName: inviter.tenant?.name ?? "Workspace",
      invitedBy: inviter.fullName,
      inviteUrl,
    });

    await auditService.log({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "team.invite.email",
      entity: "invite",
      entityId: dto.email,
      metadata: { email: dto.email, role: dto.role, department: dto.department ?? null },
    });

    res.status(201).json({ accepted: true });
  },
  async listTeam(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.listTeamMembers(tenantId));
  },
  async listRoles(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.listRoles(tenantId));
  },
  async getRoleById(req: Request, res: Response) {
    const { tenantId } = context(req);
    const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    const role = await clientService.getRoleById(tenantId, roleId);
    if (!role) {
      throw new AppError(404, "Role not found");
    }
    res.json(role);
  },
  async createRole(req: Request, res: Response) {
    const ctx = context(req);
    const { name, description, permissions } = req.body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError(400, "Role name is required");
    }
    
    // Check if role with same name already exists
    const existing = await prisma.role.findFirst({
      where: { tenantId: ctx.tenantId, name: name.trim() }
    });
    
    if (existing) {
      throw new AppError(409, "Role with this name already exists");
    }
    
    // Generate code from name
    const code = name.toLowerCase().replace(/\s+/g, '_');
    
    // Create role
    const role = await prisma.role.create({
      data: {
        tenantId: ctx.tenantId,
        name: name.trim(),
        code,
        isSystem: false,
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
    
    // Add permissions if provided
    if (Array.isArray(permissions) && permissions.length > 0) {
      const permissionRecords = await prisma.permission.findMany({
        where: { code: { in: permissions } }
      });
      
      if (permissionRecords.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionRecords.map(p => ({
            roleId: role.id,
            permissionId: p.id
          }))
        });
      }
    }
    
    await auditService.log({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "role.create",
      entity: "role",
      entityId: role.id,
      metadata: { name, code }
    });
    
    res.status(201).json(role);
  },
  async updateRole(req: Request, res: Response) {
    const ctx = context(req);
    const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    const { name, description, permissions } = req.body;
    
    // Get current role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { tenant: true }
    });
    
    if (!role) {
      throw new AppError(404, "Role not found");
    }
    
    if (role.tenantId !== ctx.tenantId) {
      throw new AppError(403, "Access denied");
    }
    
    // Prevent editing system roles
    if (role.isSystem) {
      throw new AppError(403, "Cannot modify system roles");
    }
    
    // Update role
    const updated = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: name?.trim() || role.name,
        updatedAt: new Date()
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
    
    // Update permissions if provided
    if (Array.isArray(permissions)) {
      // Remove all current permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      });
      
      // Add new permissions
      if (permissions.length > 0) {
        const permissionRecords = await prisma.permission.findMany({
          where: { code: { in: permissions } }
        });
        
        if (permissionRecords.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionRecords.map(p => ({
              roleId,
              permissionId: p.id
            }))
          });
        }
      }
    }
    
    await auditService.log({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "role.update",
      entity: "role",
      entityId: roleId,
      metadata: { name }
    });
    
    res.json(updated);
  },
  async deleteRole(req: Request, res: Response) {
    const ctx = context(req);
    const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    
    // Get role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } }
    });
    
    if (!role) {
      throw new AppError(404, "Role not found");
    }
    
    if (role.tenantId !== ctx.tenantId) {
      throw new AppError(403, "Access denied");
    }
    
    // Prevent deleting system roles
    if (role.isSystem) {
      throw new AppError(403, "Cannot delete system roles");
    }
    
    // Prevent deleting roles with assigned users
    if (role._count.users > 0) {
      throw new AppError(409, "Cannot delete role with assigned users");
    }
    
    // Delete role
    await prisma.role.delete({
      where: { id: roleId }
    });
    
    await auditService.log({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "role.delete",
      entity: "role",
      entityId: roleId,
      metadata: { name: role.name }
    });
    
    res.json({ success: true });
  },
  async duplicateRole(req: Request, res: Response) {
    const ctx = context(req);
    const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    
    // Get original role
    const originalRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true }
    });
    
    if (!originalRole) {
      throw new AppError(404, "Role not found");
    }
    
    if (originalRole.tenantId !== ctx.tenantId) {
      throw new AppError(403, "Access denied");
    }
    
    // Create duplicate
    const newCode = `${originalRole.code}_copy_${Date.now()}`;
    const newRole = await prisma.role.create({
      data: {
        tenantId: ctx.tenantId,
        name: `${originalRole.name} (Copy)`,
        code: newCode,
        isSystem: false,
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
    
    // Copy permissions
    if (originalRole.permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: originalRole.permissions.map(p => ({
          roleId: newRole.id,
          permissionId: p.permissionId
        }))
      });
    }
    
    await auditService.log({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "role.duplicate",
      entity: "role",
      entityId: newRole.id,
      metadata: { originalRoleId: originalRole.id, originalName: originalRole.name }
    });
    
    res.status(201).json(newRole);
  },
  async updateSettings(req: Request, res: Response) {
    const dto = updateSettingsSchema.parse(req.body);
    const ctx = context(req);
    res.json(await clientService.updateSettings(ctx.tenantId, ctx.userId, dto));
  },
  async getSettings(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.getSettings(tenantId));
  },
  async createApiKey(req: Request, res: Response) {
    const dto = createApiKeySchema.parse(req.body);
    const ctx = context(req);
    res.status(201).json(await clientService.createApiKey(ctx.tenantId, ctx.userId, dto));
  },
  async listApiKeys(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.listApiKeys(tenantId));
  },
  async deleteApiKey(req: Request, res: Response) {
    const ctx = context(req);
    const { apiKeyId } = req.params;
    await clientService.deleteApiKey(ctx.tenantId, ctx.userId, apiKeyId);
    res.status(204).send();
  },
  async updateProfileSecurity(req: Request, res: Response) {
    const dto = updateProfileSecuritySchema.parse(req.body);
    const { tenantId, userId } = context(req);
    res.json(await clientService.updateProfileSecurity(userId, tenantId, dto));
  },
  async tenantReport(req: Request, res: Response) {
    const { tenantId, userId } = context(req);
    const [documents, workflows, notifications, favorites, quota] = await Promise.all([
      clientService.listDocuments(tenantId),
      clientService.listWorkflows(tenantId),
      clientService.listNotifications(tenantId, userId),
      clientService.listFavorites(tenantId, userId),
      clientService.getTenantQuota(tenantId),
    ]);
    res.json({
      totals: {
        documents: documents.length,
        workflows: workflows.length,
        notifications: notifications.length,
        favorites: favorites.length,
      },
      quota,
    });
  },
  async quota(req: Request, res: Response) {
    const { tenantId } = context(req);
    res.json(await clientService.getTenantQuota(tenantId));
  },

  async recentActivity(req: Request, res: Response) {
    const { tenantId } = context(req);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const rows = await clientService.listAuditLogs(tenantId, limit);
    res.json({
      entries: rows.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        createdAt: a.createdAt.toISOString(),
        actorEmail: a.actor?.email,
        actorName: a.actor?.fullName,
        metadata: a.metadata,
      })),
    });
  },
};
