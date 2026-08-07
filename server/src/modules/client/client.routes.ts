import { Router } from "express";
import { authOrApiKeyMiddleware } from "../../common/middleware/auth-or-api-key.middleware.js";
import { optionalAuthMiddleware } from "../../common/middleware/optional-auth.middleware.js";
import { requireRole } from "../../common/middleware/rbac.middleware.js";
import { tenantBoundaryMiddleware } from "../../common/middleware/tenant.middleware.js";
import { uploadDocumentMiddleware } from "../../common/middleware/upload.middleware.js";
import { fileAccessMiddleware } from "../../common/middleware/file-access.middleware.js";
import { clientController } from "./controllers/client.controller.js";
import { clientProfileController } from "./controllers/client-profile.controller.js";

/** Roles that can mutate documents / folders (viewers and custom read-only roles stay out). */
const DOC_WRITE_ROLES = ["TENANT_OWNER", "ADMIN", "MANAGER", "STAFF", "API_KEY"];
const ADMIN_ROLES = ["TENANT_OWNER", "ADMIN"];

export const clientRoutes = Router();

clientRoutes.get(
  "/documents/:documentId/download",
  optionalAuthMiddleware,
  fileAccessMiddleware,
  clientController.streamDownload,
);

// Public shared-link resolve / view / download (no auth)
clientRoutes.get("/shared/:token", clientController.resolveSharedLink);
clientRoutes.get("/shared/:token/view", clientController.viewSharedLink);
clientRoutes.get("/shared/:token/download", clientController.downloadSharedLink);

clientRoutes.use(authOrApiKeyMiddleware, tenantBoundaryMiddleware);
clientRoutes.get("/profile", clientProfileController.getProfile);
clientRoutes.patch("/profile", clientProfileController.updateProfile);
clientRoutes.patch("/profile/password", clientProfileController.updatePassword);
clientRoutes.patch("/profile/preferences", clientProfileController.updatePreferences);
clientRoutes.post("/folders", requireRole(DOC_WRITE_ROLES), clientController.createFolder);
clientRoutes.patch("/folders/:folderId", requireRole(DOC_WRITE_ROLES), clientController.renameFolder);
clientRoutes.delete("/folders/:folderId", requireRole(DOC_WRITE_ROLES), clientController.deleteFolder);
clientRoutes.get("/folders", clientController.listFolders);
clientRoutes.post("/documents", requireRole(DOC_WRITE_ROLES), clientController.createDocument);
clientRoutes.post(
  "/documents/upload",
  requireRole(DOC_WRITE_ROLES),
  uploadDocumentMiddleware.single("file"),
  clientController.uploadDocument,
);
clientRoutes.post("/documents/:documentId/signed-url", clientController.signedDownloadUrl);
clientRoutes.patch("/documents/:documentId", requireRole(DOC_WRITE_ROLES), clientController.renameDocument);
clientRoutes.delete("/documents/:documentId", requireRole(DOC_WRITE_ROLES), clientController.deleteDocument);
clientRoutes.post("/documents/:documentId/archive", requireRole(DOC_WRITE_ROLES), clientController.archiveDocument);
clientRoutes.post("/documents/:documentId/restore", requireRole(DOC_WRITE_ROLES), clientController.restoreDocument);
clientRoutes.get("/documents", clientController.listDocuments);
clientRoutes.post("/documents/share", requireRole(DOC_WRITE_ROLES), clientController.shareDocument);
clientRoutes.get("/shared-links", clientController.listSharedLinks);
clientRoutes.delete("/shared-links/:linkId", requireRole(DOC_WRITE_ROLES), clientController.revokeSharedLink);
clientRoutes.post("/documents/:documentId/favorite", clientController.favoriteDocument);
clientRoutes.delete("/documents/:documentId/favorite", clientController.unfavoriteDocument);
clientRoutes.get("/favorites", clientController.listFavorites);
clientRoutes.post("/workflows", requireRole(ADMIN_ROLES), clientController.createWorkflow);
clientRoutes.get("/workflows", clientController.listWorkflows);
clientRoutes.post("/notifications", requireRole(ADMIN_ROLES), clientController.createNotification);
clientRoutes.get("/notifications", clientController.listNotifications);
clientRoutes.post("/notifications/mark-all-read", clientController.markAllNotificationsRead);
clientRoutes.post("/team/invite", requireRole(ADMIN_ROLES), clientController.inviteMember);
clientRoutes.post("/team/invite-email", requireRole(ADMIN_ROLES), clientController.inviteMemberByEmail);
clientRoutes.get("/team", clientController.listTeam);
clientRoutes.get("/roles", clientController.listRoles);
clientRoutes.get("/roles/:roleId", clientController.getRoleById);
clientRoutes.post("/roles", requireRole(ADMIN_ROLES), clientController.createRole);
clientRoutes.patch("/roles/:roleId", requireRole(ADMIN_ROLES), clientController.updateRole);
clientRoutes.delete("/roles/:roleId", requireRole(ADMIN_ROLES), clientController.deleteRole);
clientRoutes.post("/roles/:roleId/duplicate", requireRole(ADMIN_ROLES), clientController.duplicateRole);
clientRoutes.patch("/settings", requireRole(ADMIN_ROLES), clientController.updateSettings);
clientRoutes.get("/settings", clientController.getSettings);
clientRoutes.post("/api-keys", requireRole(ADMIN_ROLES), clientController.createApiKey);
clientRoutes.get("/api-keys", requireRole(ADMIN_ROLES), clientController.listApiKeys);
clientRoutes.delete("/api-keys/:apiKeyId", requireRole(ADMIN_ROLES), clientController.deleteApiKey);
clientRoutes.get("/reports/tenant", clientController.tenantReport);
clientRoutes.get("/activity", clientController.recentActivity);
clientRoutes.get("/quotas", clientController.quota);
