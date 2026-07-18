/**
 * Public app origin for share links and absolute redirects.
 * Set NEXT_PUBLIC_APP_URL when deploying (VPS IP or domain).
 */
export function appBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function isBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
}

export function buildShareUrl(token: string): string {
  return `${appBaseUrl()}/share/${token}`;
}
