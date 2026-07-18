import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

if (typeof window !== "undefined") {
  const existing = localStorage.getItem("dms_access_token");
  if (existing) api.defaults.headers.common.Authorization = `Bearer ${existing}`;
}

let refreshPromise: Promise<string> | null = null;

function shouldSkipRefreshRetry(config: { url?: string }): boolean {
  const u = config.url ?? "";
  return (
    u.includes("/auth/refresh") ||
    u.includes("/admin/auth/refresh") ||
    u.includes("/auth/logout") ||
    u.includes("/admin/auth/logout")
  );
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const client = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    refreshPromise = (async () => {
      try {
        const r = await client.post<{ accessToken: string }>("/auth/refresh", {});
        return r.data.accessToken;
      } catch {
        const r = await client.post<{ accessToken: string }>("/admin/auth/refresh", {});
        return r.data.accessToken;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response || error.response.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    if (shouldSkipRefreshRetry(originalRequest)) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      localStorage.setItem("dms_access_token", accessToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api.request(originalRequest);
    } catch (refreshErr) {
      localStorage.removeItem("dms_access_token");
      delete api.defaults.headers.common.Authorization;
      return Promise.reject(refreshErr);
    }
  },
);

export function setTokens(accessToken: string) {
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    localStorage.setItem("dms_access_token", accessToken);
  }
}

export async function clearTokens() {
  await Promise.allSettled([api.post("/auth/logout"), api.post("/admin/auth/logout")]);
  delete api.defaults.headers.common.Authorization;
  localStorage.removeItem("dms_access_token");
}

export default api;
