/** Roles that may download files (signed URL / attachment). Others get view-only preview. */
const DOWNLOAD_ROLES = new Set([
    "TENANT_OWNER",
    "ADMIN",
    "MANAGER",
    "STAFF",
    "API_KEY",
]);
export function canDownloadDocuments(roleCode) {
    if (!roleCode)
        return false;
    return DOWNLOAD_ROLES.has(roleCode.toUpperCase());
}
export function isViewOnlyRole(roleCode) {
    if (!roleCode)
        return true;
    const code = roleCode.toUpperCase();
    return code === "VIEWER" || code === "APPROVER";
}
