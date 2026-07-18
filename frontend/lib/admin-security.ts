import api from "./api";

export type AdminSecurityStats = {
  activeSessions: number;
  failedLogins24h: number;
  blockedIps: number;
  securityAlerts24h: number;
};

export type AdminLoginActivityEntry = {
  id: string;
  status: "success" | "failed";
  timestamp: string;
  ip: string | null;
  userAgent: string | null;
  user: string | null;
  name: string | null;
  tenantId: string | null;
};

export async function getAdminSecurityOverview(): Promise<AdminSecurityStats> {
  const resp = await api.get("/admin/security/overview");
  return resp.data.stats as AdminSecurityStats;
}

export async function getAdminLoginActivity(limit = 50): Promise<AdminLoginActivityEntry[]> {
  const resp = await api.get("/admin/security/login-activity", { params: { limit } });
  return resp.data.activity as AdminLoginActivityEntry[];
}

export type AdminFailedAttempt = {
  ip: string;
  attempts: number;
  lastAttempt: string;
  status: "blocked" | "warning";
  user: string;
};

export type AdminIpRule = {
  id: string;
  type: "BLOCK" | "WHITELIST";
  ipCidr: string;
  description: string | null;
  reason: string | null;
  createdAt: string;
};

export async function getAdminFailedAttempts(): Promise<AdminFailedAttempt[]> {
  const resp = await api.get("/admin/security/failed-attempts");
  return resp.data.attempts as AdminFailedAttempt[];
}

export async function getAdminIpRules(): Promise<{ blocked: AdminIpRule[]; whitelisted: AdminIpRule[] }> {
  const resp = await api.get("/admin/security/ip-rules");
  return resp.data as { blocked: AdminIpRule[]; whitelisted: AdminIpRule[] };
}

export async function createAdminIpRule(dto: {
  type: "BLOCK" | "WHITELIST";
  ipCidr: string;
  description?: string;
  reason?: string;
}): Promise<AdminIpRule> {
  const resp = await api.post("/admin/security/ip-rules", dto);
  return resp.data.rule as AdminIpRule;
}

export async function deleteAdminIpRule(id: string): Promise<void> {
  await api.delete(`/admin/security/ip-rules/${id}`);
}

