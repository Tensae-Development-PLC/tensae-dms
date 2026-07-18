import api from "./api";

export type TenantReport = {
  totals: { documents: number; workflows: number; notifications: number; favorites: number };
  quota: { storageLimitMb: number; storageUsedMb: number } | null;
};

export async function getTenantReport() {
  const { data } = await api.get<TenantReport>("/client/reports/tenant");
  return data;
}

export async function getProfile() {
  const { data } = await api.get<{
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    tenantName?: string;
    companyName?: string;
    roleName?: string;
    status: string;
    twoFactorEnabled: boolean;
    preferences?: {
      sessionTimeoutMinutes: number;
      loginNotifications: boolean;
      emailNotifications: boolean;
      pushNotifications: boolean;
      documentExpiryAlerts: boolean;
      workflowUpdates: boolean;
      weeklyDigest: boolean;
    };
    createdAt: string;
  }>("/client/profile");
  return data;
}

export async function updateProfile(body: { fullName: string; email: string; phone?: string | null }) {
  const { data } = await api.patch<{
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    tenantName?: string;
    companyName?: string;
    roleName?: string;
    status: string;
    twoFactorEnabled: boolean;
    preferences?: {
      sessionTimeoutMinutes: number;
      loginNotifications: boolean;
      emailNotifications: boolean;
      pushNotifications: boolean;
      documentExpiryAlerts: boolean;
      workflowUpdates: boolean;
      weeklyDigest: boolean;
    };
    createdAt: string;
  }>("/client/profile", body);
  return data;
}

export async function updatePreferences(body: {
  sessionTimeoutMinutes: number;
  loginNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  documentExpiryAlerts: boolean;
  workflowUpdates: boolean;
  weeklyDigest: boolean;
}) {
  const { data } = await api.patch<{ success?: boolean; sessionTimeoutMinutes: number; loginNotifications: boolean; emailNotifications: boolean; pushNotifications: boolean; documentExpiryAlerts: boolean; workflowUpdates: boolean; weeklyDigest: boolean }>("/client/profile/preferences", body);
  return data;
}

export async function updatePassword(body: { currentPassword: string; newPassword: string }) {
  const { data } = await api.patch<{ success: boolean }>("/client/profile/password", body);
  return data;
}

export async function listDocuments() {
  const { data } = await api.get<unknown[]>("/client/documents");
  return data;
}

export async function listFolders() {
  const { data } = await api.get<
    {
      id: string;
      name: string;
      _count: { documents: number };
    }[]
  >("/client/folders");
  return data;
}

export async function listNotifications() {
  const { data } = await api.get<unknown[]>("/client/notifications");
  return data;
}

export async function listTeamMembers() {
  const { data } = await api.get<
    {
      id: string;
      userId: string;
      invitedById: string;
      createdAt: string;
      user: {
        id: string;
        fullName: string;
        email: string;
        status: string;
        role: {
          id: string;
          name: string;
          code: string;
          isSystem: boolean;
        };
      };
    }[]
  >("/client/team");
  return data;
}

export async function listRoles() {
  const { data } = await api.get<
    {
      id: string;
      name: string;
      code: string;
      isSystem: boolean;
      createdAt: string;
      _count: { users: number };
    }[]
  >("/client/roles");
  return data;
}

export async function getRoleById(roleId: string) {
  const { data } = await api.get<{
    id: string;
    name: string;
    code: string;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
    permissions: {
      roleId: string;
      permissionId: string;
      permission: {
        id: string;
        code: string;
        name: string;
      };
    }[];
    _count: { users: number };
  }>(`/client/roles/${roleId}`);
  return data;
}

export async function createRole(body: {
  name: string;
  description?: string;
  permissions?: string[];
}) {
  const { data } = await api.post<{
    id: string;
    name: string;
    code: string;
    isSystem: boolean;
    createdAt: string;
  }>("/client/roles", body);
  return data;
}

export async function updateRole(
  roleId: string,
  body: {
    name?: string;
    description?: string;
    permissions?: string[];
  }
) {
  const { data } = await api.patch<{
    id: string;
    name: string;
    code: string;
    isSystem: boolean;
    updatedAt: string;
    permissions: {
      roleId: string;
      permissionId: string;
      permission: {
        id: string;
        code: string;
        name: string;
      };
    }[];
    _count: { users: number };
  }>(`/client/roles/${roleId}`, body);
  return data;
}

export async function deleteRole(roleId: string) {
  const { data } = await api.delete<{ success: boolean }>(`/client/roles/${roleId}`);
  return data;
}

export async function duplicateRole(roleId: string) {
  const { data } = await api.post<{
    id: string;
    name: string;
    code: string;
    isSystem: boolean;
    createdAt: string;
  }>(`/client/roles/${roleId}/duplicate`);
  return data;
}

export async function inviteTeamMemberByEmail(body: {
  email: string;
  role: string;
  department?: string;
  expiryDate?: string;
}) {
  const { data } = await api.post<{ accepted: boolean }>("/client/team/invite-email", body);
  return data;
}

export async function getSignedDownloadUrl(documentId: string) {
  const { data } = await api.post<{ url: string; expiresInSeconds: number }>(
    `/client/documents/${documentId}/signed-url`,
    {},
  );
  return data;
}

export async function toggleFavorite(documentId: string) {
  const { data } = await api.post(`/client/documents/${documentId}/favorite`);
  return data;
}

export async function shareDocument(body: { documentId: string; expiresAt?: string; allowDownload: boolean }) {
  const { data } = await api.post("/client/documents/share", body);
  return data;
}

export async function listSharedLinks() {
  const { data } = await api.get<
    {
      id: string;
      token: string;
      expiresAt: string | null;
      allowDownload: boolean;
      createdAt: string;
      document: {
        id: string;
        name: string;
        mimeType: string;
        createdAt: string;
      };
    }[]
  >("/client/shared-links");
  return data;
}

export async function listWorkflows() {
  const { data } = await api.get<unknown[]>("/client/workflows");
  return data;
}

export async function listFavorites() {
  const { data } = await api.get<unknown[]>("/client/favorites");
  return data;
}

export async function recentActivity(limit = 15) {
  const { data } = await api.get<{
    entries: {
      id: string;
      action: string;
      entity: string;
      createdAt: string;
      actorEmail?: string | null;
      actorName?: string | null;
    }[];
  }>("/client/activity", { params: { limit } });
  return data.entries;
}

/** Admin (sysadmin) APIs */
export async function getAdminOverview() {
  const { data } = await api.get<{
    counts: { tenants: number; users: number; documents: number; auditEvents24h: number };
    storageBytesTotal: string;
  }>("/admin/overview");
  return data;
}

export async function listAdminTenants() {
  const { data } = await api.get<{
    tenants: {
      id: string;
      name: string;
      slug: string;
      companyName: string;
      userCount: number;
      documentCount: number;
      storageUsedMb: number;
      storageLimitMb: number;
      createdAt: string;
    }[];
  }>("/admin/tenants");
  return data.tenants;
}

export async function listAdminUsers() {
  const { data } = await api.get<{
    users: {
      id: string;
      name: string | null;
      email: string;
      company?: string | null;
      role?: string | null;
      status?: string | null;
      lastActive?: string | null;
      lastLogin?: string | null;
      loginIp?: string | null;
    }[];
  }>("/admin/users");
  return data.users;
}

export async function listAdminAuditRecent(limit = 20) {
  const { data } = await api.get<{
    entries: {
      id: string;
      action: string;
      entity: string;
      createdAt: string;
      actorEmail?: string | null;
      actorName?: string | null;
    }[];
  }>("/admin/audit/recent", { params: { limit } });
  return data.entries;
}

export async function listAdminNotifications() {
  const { data } = await api.get<{
    notifications: {
      id: string;
      title: string;
      body: string;
      createdAt: string;
      readAt?: string | null;
      user?: {
        id: string;
        email: string;
        fullName?: string | null;
      };
    }[];
  }>("/admin/notifications");
  return data.notifications;
}

export async function createAdminNotification(body: { userId: string; title: string; body: string }) {
  const { data } = await api.post<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
    user?: {
      id: string;
      email: string;
      fullName?: string | null;
    };
  }>("/admin/notifications", body);
  return data;
}

export async function getAdminStorageMetrics() {
  const { data } = await api.get<{
    overall: {
      totalUsedGb: number;
      totalLimitGb: number;
      percentageUsed: number;
    };
    companies: {
      tenantId: string;
      name: string;
      usedGb: number;
      limitGb: number;
      percentage: number;
      usedBytes: string;
      limitBytes: string;
    }[];
    nearLimitCount: number;
  }>("/admin/storage/metrics");
  return data;
}

export async function getDetailedReports() {
  const { data } = await api.get<{
    kpis: {
      title: string;
      value: string;
      change: string;
      trend: string;
    }[];
    topTenants: {
      name: string;
      documents: number;
      users: number;
      storageGb: number;
    }[];
  }>("/admin/reports/detailed");
  return data;
}

/** Client API Key Management */
export async function listApiKeys() {
  const { data } = await api.get<{
    id: string;
    name: string;
    keyHash: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
  }[]>("/client/api-keys");
  return data;
}

export async function createApiKey(body: { name: string; expiresAt?: string }) {
  const { data } = await api.post<{
    id: string;
    name: string;
    keyHash: string;
    expiresAt: string | null;
    createdAt: string;
    rawKey: string;
  }>("/client/api-keys", body);
  return data;
}

export async function deleteApiKey(apiKeyId: string) {
  await api.delete(`/client/api-keys/${apiKeyId}`);
  return { success: true };
}

/** Auth APIs */
export async function acceptInvite(body: { token: string; email: string; fullName: string; password: string }) {
  const { data } = await api.post<{
    userId: string;
    tenantId: string;
    roleId: string;
  }>("/auth/invites/accept", body);
  return data;
}

/** Document Upload */
export async function uploadDocument(
  file: File,
  options?: {
    documentType?: string;
    entity?: string;
    expiryDate?: string;
    onProgress?: (progress: number) => void;
  }
) {
  const formData = new FormData();
  formData.append('file', file);

  if (options?.documentType) {
    formData.append('documentType', options.documentType);
  }
  if (options?.entity) {
    formData.append('entity', options.entity);
  }
  if (options?.expiryDate) {
    formData.append('expiryDate', options.expiryDate);
  }

  const { data } = await api.post<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: string;
    storageKey: string;
    createdAt: string;
  }>("/client/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (options?.onProgress) {
        const total = progressEvent.total || file.size;
        const progress = Math.round((progressEvent.loaded / total) * 100);
        options.onProgress(progress);
      }
    },
  });

  return data;
}
