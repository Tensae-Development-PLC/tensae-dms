/** Mirrors server document-access.ts for UI hints. */
export function canDownloadDocuments(roleCode: string | undefined): boolean {
  if (!roleCode) return false
  return ['TENANT_OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'API_KEY'].includes(roleCode.toUpperCase())
}

export function isViewOnlyRole(roleCode: string | undefined): boolean {
  if (!roleCode) return true
  const code = roleCode.toUpperCase()
  return code === 'VIEWER' || code === 'APPROVER'
}

export function roleAccessLabel(roleCode: string): string {
  const code = roleCode.toUpperCase()
  if (code === 'VIEWER') return 'View only (preview, no download)'
  if (code === 'APPROVER') return 'Review & approve (preview, no download)'
  if (['TENANT_OWNER', 'ADMIN'].includes(code)) return 'Full access (upload, download, manage)'
  if (code === 'MANAGER') return 'Manage team & documents (download)'
  if (code === 'STAFF') return 'Create & edit documents (download)'
  return 'Custom role'
}
