/** Role codes that tenants must never mint — used by platform or built-in ACL. */
export const RESERVED_ROLE_CODES = new Set([
  "SYS_ADMIN",
  "TENANT_OWNER",
  "ADMIN",
  "MANAGER",
  "STAFF",
  "VIEWER",
  "APPROVER",
]);

/** Codes that map to elevated tenant write/admin routes (requireRole). */
export const PRIVILEGED_TENANT_ROLE_CODES = new Set([
  "TENANT_OWNER",
  "ADMIN",
  "MANAGER",
  "STAFF",
]);

export function normalizeRoleCode(nameOrCode: string): string {
  return nameOrCode.trim().toUpperCase().replace(/\s+/g, "_");
}

export function assertRoleCodeAllowed(code: string): void {
  const normalized = normalizeRoleCode(code);
  if (RESERVED_ROLE_CODES.has(normalized)) {
    throw new Error(`Role code "${normalized}" is reserved`);
  }
}

/** Fixed invite / default roles that may be created on demand (not SYS_ADMIN / TENANT_OWNER). */
export const ALLOWED_INVITE_ROLE_CODES = new Set([
  "ADMIN",
  "MANAGER",
  "STAFF",
  "VIEWER",
  "APPROVER",
]);
