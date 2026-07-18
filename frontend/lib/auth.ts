import api, { setTokens, clearTokens } from "./api";

export type TenantSummary = {
  tenantId: string;
  tenantName: string;
  slug: string;
  companyName: string;
};

export async function listTenants(email: string): Promise<TenantSummary[]> {
  const resp = await api.get("/auth/tenants", { params: { email } });
  return resp.data.tenants as TenantSummary[];
}

export async function login({
  email,
  password,
  tenantId,
  twoFactorCode,
}: {
  email: string;
  password: string;
  tenantId: string;
  twoFactorCode?: string;
}) {
  const resp = await api.post("/auth/login", {
    email,
    password,
    tenantId,
    twoFactorCode,
  });
  const { accessToken } = resp.data as { accessToken: string };
  setTokens(accessToken);
  return resp.data;
}

export async function register(dto: {
  tenantName: string;
  companyName: string;
  fullName: string;
  email: string;
  password: string;
}) {
  const resp = await api.post("/auth/register", dto);
  return resp.data;
}

export async function forgotPassword(dto: { email: string; tenantId: string }) {
  const resp = await api.post("/auth/forgot-password", dto);
  return resp.data as { accepted: boolean };
}

export async function resetPassword(dto: { token: string; newPassword: string }) {
  const resp = await api.post("/auth/reset-password", dto);
  return resp.data as { updated: boolean };
}

export async function adminLogin(dto: { email: string; password: string }) {
  const resp = await api.post("/admin/auth/login", dto);
  const { accessToken } = resp.data as { accessToken: string };
  setTokens(accessToken);
  return resp.data;
}

export async function logout() {
  await clearTokens();
}

const auth = { login, register, logout };
export default auth;
