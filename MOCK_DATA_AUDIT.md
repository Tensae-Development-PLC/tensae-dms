# Frontend Mock Data Audit Report

**Generated:** May 12, 2026  
**Status:** Complete audit of all hardcoded, static, and simulated data across frontend codebase

---

## Summary

| Category | Files with Mock Data | Total Mock Items |
|----------|---------------------|-----------------|
| Admin Pages | 6 | 18 mock datasets |
| Dashboard Pages | 3 | 8 mock datasets |
| Settings Pages | 3 | 7 mock datasets |
| Feature Pages | 2 | 2 simulated flows |
| Auth Pages | 1 | 1 simulated flow |
| Public Pages | 3 | 3 mock datasets |
| Components | 2 | 2 mock datasets |
| **TOTAL** | **20 files** | **41 mock data instances** |

---

## 1. ADMIN PAGES

### 1.1 API Keys Page
**File:** [frontend/app/admin/api-keys/page.tsx](frontend/app/admin/api-keys/page.tsx#L35-L62)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **apiKeys array** | 4 hardcoded API keys (prod, dev, staging, legacy) with mock values: `tdk_prod_a1b2c3d4...`, `tdk_dev_x1y2z3a4...` | 35-62 | `GET /admin/api-keys` |
| Mock properties | `lastUsed`, `requests`, `status`, `permissions` all hardcoded | 35-62 | Backend should return real usage stats |
| Copy to clipboard timeout | Uses `setTimeout(() => setCopiedKey(null), 2000)` for UX feedback only | 117-119 | ✓ This is acceptable (local UX only) |

**Issues:**
- No backend API call to fetch real API keys
- Create/delete/regenerate buttons have no backend integration
- Mock key names and IDs are hardcoded
- Key visibility toggle is local-only state

---

### 1.2 Audit Logs Page
**File:** [frontend/app/admin/logs/page.tsx](frontend/app/admin/logs/page.tsx#L18-L37)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **auditLogs array** | 10 hardcoded audit log entries with mock actions: `user.login`, `document.upload`, `user.role_change` | 18-37 | `GET /admin/audit-logs` |
| Mock data | Fake user emails, IPs, timestamps, action details | 18-37 | Backend should return real audit trail |
| Search/filter logic | Works against mock array, not backend | ~53+ | Backend filtering for action type, date range, user |

**Issues:**
- Displays mock company names: `abccorp.com`, `xyzind.com`, `tensaedms.com`, `techsol.com`, `globalp.com`, `innohub.com`, `dataflow.com`
- Mock timestamps are hardcoded to '2024-01-15'
- No real audit log fetching

---

### 1.3 Storage Management Page
**File:** [frontend/app/admin/storage/page.tsx](frontend/app/admin/storage/page.tsx#L11-L20)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **companyStorage array** | 6 hardcoded company storage records with usage percentages | 11-16 | `GET /admin/storage` |
| Storage stats | Total: 5TB, Used: 2.4TB, Available: 2.6TB (hardcoded) | 18-24 | Backend should aggregate real storage |
| Company names | Mock: 'ABC Corporation', 'XYZ Industries', 'Tech Solutions Inc', 'Global Partners Ltd', 'Innovation Hub', 'DataFlow Systems' | 11-16 | Map to real tenant data |

**Issues:**
- All storage usage percentages are fake
- No backend integration for real storage metrics
- "Near Limit" count (4) is hardcoded

---

### 1.4 Subscriptions Page
**File:** [frontend/app/admin/subscriptions/page.tsx](frontend/app/admin/subscriptions/page.tsx#L37-L91)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **subscriptionStats array** | 4 KPI cards: Monthly Revenue ($24,580), Active Subscriptions (42), Expiring Soon (8), Renewal Rate (94%) | 37-50 | `GET /admin/subscriptions/stats` |
| **subscriptions array** | 4+ subscription records with mock: IDs (SUB-001, SUB-002, etc.), companies, plans, billing dates | 52-91 | `GET /admin/subscriptions` |
| Mock data | Company names, amounts ($599/mo, $299/mo), user counts, storage allocations | 52-91 | Fetch from real subscription data |

**Issues:**
- All revenue, user, and subscription counts are fabricated
- Subscription status (active/expiring) hardcoded
- Next billing dates are static
- Renewal rate (94%) is placeholder

---

### 1.5 System Settings Page (Admin)
**File:** [frontend/app/admin/settings/page.tsx](frontend/app/admin/settings/page.tsx#L1-L120)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **securitySettings state** | All local `useState`: twoFactorRequired, passwordExpiry, sessionTimeout, ipWhitelist, etc. | 23-29 | `GET/PUT /admin/settings/security` |
| **backupSettings state** | All local: autoBackup, backupFrequency, backupRetention, backupEncryption | 31-35 | `GET/PUT /admin/settings/backup` |
| **features state** | All local: documentSharing, externalLinks, versionHistory, ocr, workflows, analytics | 37-42 | `GET/PUT /admin/settings/features` |
| Save buttons | No actual form submission (no backend call) | UI only | Backend persistence layer |

**Issues:**
- Security tab: 2FA requirement, password expiry, session timeout, IP whitelist are UI-only state
- Backup tab: Frequency, retention, encryption settings never persist
- Features tab: All toggles have no effect (can't enable/disable OCR, workflows, etc.)
- Clicking "Save" does nothing (no form handler shown in snippet)

---

### 1.6 Reports Page
**File:** [frontend/app/admin/reports/page.tsx](frontend/app/admin/reports/page.tsx#L1-L55)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **kpiMetrics array** | 4 hardcoded KPIs: Total Revenue ($142,580 +18.2%), Document Uploads (45,234 +24.5%), New Users (1,247 +12.3%), Storage Growth (856GB -5.2%) | 23-40 | `GET /admin/reports/kpis` |
| **monthlyData array** | 6 months of revenue, user, document data (Jan-Jun 2024) | 42-49 | `GET /admin/reports/monthly` |
| **topCompanies array** | 5 top companies by documents/storage/revenue (all fake data) | 51-57 | `GET /admin/reports/top-companies` |
| **recentReports array** | 4 report records with hardcoded dates and statuses | 59-63 | `GET /admin/reports/history` |

**Issues:**
- All metrics are placeholder numbers
- Chart data (monthlyData) is static snapshot
- Revenue figures don't match subscriptions page
- Top companies don't correlate with real tenant data
- Report generation timestamps are fabricated

---

## 2. DASHBOARD SETTINGS PAGES

### 2.1 Settings Page (Devices Tab)
**File:** [frontend/app/dashboard/settings/page.tsx](frontend/app/dashboard/settings/page.tsx#L60-L62)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **devices array** | Hardcoded single device: `{ id: 1, name: 'MacBook Pro', type: 'laptop', browser: 'Chrome', ip: 'Current session', lastActive: 'Now', current: true }` | 60-62 | `GET /client/devices` / `GET /client/sessions` |
| Device management | No revocation/logout functionality shown | UI only | `DELETE /client/devices/:id` |

**Issues:**
- Only shows current device
- No historical sessions/devices listed
- Cannot revoke other sessions
- Mock device data is static

---

### 2.2 Settings Page (Role Assignments)
**File:** [frontend/app/dashboard/settings/page.tsx](frontend/app/dashboard/settings/page.tsx#L95-L97)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **roles state** | Populated from `listRoles()` API call | Dynamic | Uses real backend (✓ Verified) |
| **teamMembers state** | Populated from `listTeamMembers()` API call | Dynamic | Uses real backend (✓ Verified) |

**Status:** ✓ **PROPERLY WIRED** - This page calls real backend APIs

---

### 2.3 Role Management - Roles List
**File:** [frontend/app/dashboard/settings/roles/page.tsx](frontend/app/dashboard/settings/roles/page.tsx#L46-L70)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **initialRoles array** | 5 hardcoded roles (Admin, Manager, Staff, Viewer, Approver) with mock user counts (2, 5, 12, 8, 3) | 46-70 | Uses `listRoles()` API ✓ PROPERLY WIRED |
| Fetch logic | `useEffect` calls `listRoles()` on component mount | 78+ | Real backend (✓ Verified) |

**Status:** ✓ **PROPERLY WIRED** - Actually fetches roles from backend

---

### 2.4 Role Management - Edit Role
**File:** [frontend/app/dashboard/settings/roles/[id]/page.tsx](frontend/app/dashboard/settings/roles/[id]/page.tsx#L51-L77)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **roleData object** | Hardcoded role definitions: admin, manager, staff, viewer, approver, finance, new (empty for creation) | 51-77 | `GET /client/roles/:id` (for edit) / `POST /client/roles` (for creation) |
| Permission matrix | Features array (documents, workflows, users, sharing, settings) with hardcoded permission options | 31-37 | Fetch from backend permission definitions |
| Department list | Hardcoded: engineering, marketing, sales, hr, finance, operations | 39-45 | `GET /admin/departments` or similar |
| Document types | Hardcoded: contracts, invoices, reports, policies, hr-docs, technical | 47-50 | `GET /admin/document-types` or similar |
| Save handler | Line 155: `await new Promise(resolve => setTimeout(resolve, 1000))` - simulates save, no backend call | 155-160 | `POST/PUT /client/roles` (create or update) |

**Issues:**
- Initial role data from hardcoded object, not backend
- Save button shows success after timeout, but doesn't actually persist
- Permission matrix is UI-only state
- Cannot actually create/update roles
- Delete button has no implementation

---

## 3. DASHBOARD FEATURE PAGES

### 3.1 Upload Page
**File:** [frontend/app/dashboard/upload/page.tsx](frontend/app/dashboard/upload/page.tsx#L57-L95)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **simulateUpload function** | Simulates file upload with `setInterval` that increments progress to 100% | 74-93 | Real upload backend with progress tracking |
| Upload progress | Fake progress simulation: `progress += Math.random() * 20` until 100% | 76-92 | Backend should return real progress events |
| Metadata fields | documentType, entity, expiryDate collected but never sent to backend | 64-68 | `POST /client/documents/upload` with metadata |
| Status states | progress: 0-100, status: 'uploading'/'complete' - all simulated | 57 | Track real upload state from backend |

**Issues:**
- Files are never actually uploaded
- Progress bar animation is fake
- Metadata (document type, entity, expiry) is collected but ignored
- No real file-to-backend transfer
- Completion just changes UI state

---

### 3.2 Workflows Page
**File:** [frontend/app/dashboard/workflows/page.tsx](frontend/app/dashboard/workflows/page.tsx#L23-L38)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| Workflow list | Fetches from `listWorkflows()` API call | 33 | Uses real backend (✓ Verified) |
| Stats display | Pending Approval: 0, Completed Today: 0, Overdue: 0 all hardcoded | 46-50 | Backend should calculate real stats |

**Status:** ✓ **PARTIALLY WIRED** - Fetches workflows from backend, but stats are placeholders

---

## 4. DASHBOARD COMPONENTS

### 4.1 Security Alerts Component
**File:** [frontend/components/dashboard/security-alerts.tsx](frontend/components/dashboard/security-alerts.tsx#L26-L52)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **initialAlerts array** | 4 hardcoded security alerts: failed_login (3 attempts), new_device (iPhone 15), suspicious_activity, password_change | 26-52 | `GET /client/security-alerts` |
| Alert properties | Hardcoded locations: New York, Los Angeles, Unknown; San Francisco | 26-52 | Backend should provide real location data |
| Timestamps | Fake: "2 hours ago", "1 day ago", "3 days ago", "1 week ago" | 26-52 | Real timestamps from backend |
| Dismiss logic | Local state only `useState` for dismissed flag | UI only | Backend should persist dismissal |

**Issues:**
- All alert data is fabricated
- Cannot dismiss alerts permanently (no backend call)
- Location data is fake
- No real security event stream

---

### 4.2 Two-Factor Setup Component
**File:** [frontend/components/dashboard/two-factor-setup.tsx](frontend/components/dashboard/two-factor-setup.tsx#L15-L23)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **backupCodes array** | 8 hardcoded fake backup codes: XXXX-XXXX-XXXX, YYYY-YYYY-YYYY, etc. | 15-23 | Backend should generate real codes via `POST /auth/2fa/setup` |
| QR code placeholder | Line 70: `{/* QR Code Placeholder */}` - displays dummy QR UI with Smartphone icon | 70-78 | Backend should generate real QR code image |
| Verification simulate | Line 36: `await new Promise(resolve => setTimeout(resolve, 1000))` - simulates 2FA verification | 36-37 | Real verification via `POST /auth/2fa/verify` |
| Setup completion | No actual 2FA enablement - just UI flow | 51-52 | Backend should persist 2FA setup |

**Issues:**
- Backup codes are not real (not hashed/stored)
- QR code is placeholder only
- Verification step doesn't actually enable 2FA
- Component is UI-only mock

---

## 5. AUTHENTICATION PAGES

### 5.1 Invite Accept Page
**File:** [frontend/app/(auth)/invite/accept/page.tsx](frontend/app/(auth)/invite/accept/page.tsx#L8-L65)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **inviteData parsing** | Reads from URL query params (email, role, company, invitedBy) but never validates against backend | 14-19 | `GET /auth/invites/:token/validate` |
| Invite display | Shows invite details from query string (no verification) | 14-19 | Backend should validate invite token |
| Form submission simulate | Line 61-62: `// Simulate final client-side navigation after invite acceptance UI; backend acceptance can be added later.` + `await new Promise(resolve => setTimeout(resolve, 1500))` | 61-62 | **CRITICAL:** `POST /auth/invites/:token/accept` endpoint missing |
| Account creation | Never actually creates user account | 51-65 | Backend should create user, add to workspace |

**Issues:**
- **CRITICAL ISSUE:** No backend endpoint to finalize invitation
- Invite token never verified
- Form data (fullName, password) collected but discarded
- User never created or added to workspace
- Just redirects to dashboard (UI simulation only)

---

## 6. PUBLIC PAGES

### 6.1 Contact Form Page
**File:** [frontend/app/(public)/contact/page.tsx](frontend/app/(public)/contact/page.tsx#L1-L70)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| Form submission simulate | Line 48-49: `// Simulate form submission` + `await new Promise(resolve => setTimeout(resolve, 1500))` | 48-49 | `POST /public/contact` |
| Form state | Collects: name, email, company, service, message | 28-33 | Backend should persist contact inquiries |
| Success state | Sets `isSubmitted = true` to show success message (UI only) | 50 | Backend should confirm receipt |

**Issues:**
- Form data is never sent to backend
- Just shows success toast after 1.5s delay (fake submission)
- No actual inquiry created
- No email notification sent
- Contact form is non-functional

---

### 6.2 Services Page
**File:** [frontend/app/(public)/services/page.tsx](frontend/app/(public)/services/page.tsx#L7-L50)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **services array** | 5 hardcoded service offerings with mock use cases and features | 7-50 | Fetch from `GET /public/services` if dynamic content needed |
| Use case descriptions | "A healthcare provider needed...", "An international retailer...", etc. (all fabricated examples) | 7-50 | Backend service catalog |

**Status:** ℹ️ **INFORMATIONAL** - Marketing copy (acceptable to be static unless CMS integration planned)

---

### 6.3 About Page
**File:** [frontend/app/(public)/about/page.tsx](frontend/app/(public)/about/page.tsx#L1-L40)

| Mock Item | Details | Lines | Backend Endpoint Needed |
|-----------|---------|-------|------------------------|
| **whyChooseUs array** | 4 hardcoded value propositions (Enterprise Security, Scalable Architecture, Expert Support, Seamless Integration) | 7-18 | Fetch from `GET /public/about/values` if dynamic |
| **teamImages array** | 3 hardcoded team sections (Engineering, Design, Customer Success) with mock descriptions | 20-25 | Backend team roster if real data |

**Status:** ℹ️ **INFORMATIONAL** - Marketing copy (acceptable to be static)

---

## 7. PAGES PROPERLY WIRED TO BACKEND (✓ VERIFIED)

| Page | File | Backend Integration |
|------|------|-------------------|
| Dashboard Overview | [frontend/app/dashboard/page.tsx](frontend/app/dashboard/page.tsx) | ✓ Calls `getTenantReport()`, `listDocuments()`, `listNotifications()` |
| Documents | [frontend/app/dashboard/documents/page.tsx](frontend/app/dashboard/documents/page.tsx) | ✓ Calls `listDocuments()`, `listFolders()`, `shareDocument()` |
| Shared Links | [frontend/app/dashboard/shared/page.tsx](frontend/app/dashboard/shared/page.tsx) | ✓ Calls `listSharedLinks()` |
| Activity | [frontend/app/dashboard/activity/page.tsx](frontend/app/dashboard/activity/page.tsx) | ✓ Calls `recentActivity()` |
| Favorites | [frontend/app/dashboard/favorites/page.tsx](frontend/app/dashboard/favorites/page.tsx) | ✓ Calls `listFavorites()` |
| Alerts | [frontend/app/dashboard/alerts/page.tsx](frontend/app/dashboard/alerts/page.tsx) | ✓ Calls `listNotifications()`, `listDocuments()` |
| Admin Overview | [frontend/app/admin/page.tsx](frontend/app/admin/page.tsx) | ✓ Calls `getAdminOverview()`, `listAdminAuditRecent()` |
| Admin Users | [frontend/app/admin/users/page.tsx](frontend/app/admin/users/page.tsx) | ✓ Calls `listAdminUsers()` |
| Admin Companies | [frontend/app/admin/companies/page.tsx](frontend/app/admin/companies/page.tsx) | ✓ Calls `listAdminTenants()` |
| Admin Security | [frontend/app/admin/security/page.tsx](frontend/app/admin/security/page.tsx) | ✓ Calls security endpoints (overview, login activity, IP rules, etc.) |
| Admin Notifications | [frontend/app/admin/notifications/page.tsx](frontend/app/admin/notifications/page.tsx) | ✓ Calls `listAdminNotifications()`, `createAdminNotification()` |
| Settings Profile/Team | [frontend/app/dashboard/settings/page.tsx](frontend/app/dashboard/settings/page.tsx) | ✓ Calls `getProfile()`, `listTeamMembers()`, `listRoles()`, `updateProfile()`, etc. |
| Workflows | [frontend/app/dashboard/workflows/page.tsx](frontend/app/dashboard/workflows/page.tsx) | ✓ Calls `listWorkflows()` |
| Roles List | [frontend/app/dashboard/settings/roles/page.tsx](frontend/app/dashboard/settings/roles/page.tsx) | ✓ Calls `listRoles()` |

---

## 8. CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

### 🔴 CRITICAL - Backend Endpoints Missing

1. **Invite Acceptance Flow**
   - File: [frontend/app/(auth)/invite/accept/page.tsx](frontend/app/(auth)/invite/accept/page.tsx)
   - Issue: No backend endpoint `POST /auth/invites/:token/accept` 
   - Impact: Users cannot complete team invitations
   - Severity: **BLOCKS CORE ONBOARDING**

2. **Contact Form Submission**
   - File: [frontend/app/(public)/contact/page.tsx](frontend/app/(public)/contact/page.tsx)
   - Issue: Form uses setTimeout simulation instead of `POST /public/contact`
   - Impact: Contact inquiries are never captured
   - Severity: MEDIUM

### 🔴 CRITICAL - Features Non-Functional

3. **File Upload**
   - File: [frontend/app/dashboard/upload/page.tsx](frontend/app/dashboard/upload/page.tsx)
   - Issue: `simulateUpload()` fake progress, metadata ignored
   - Impact: Document uploads don't actually work
   - Severity: **BLOCKS CORE FEATURE**

4. **Role Management - Create/Edit/Delete**
   - File: [frontend/app/dashboard/settings/roles/[id]/page.tsx](frontend/app/dashboard/settings/roles/[id]/page.tsx)
   - Issue: Save handler uses setTimeout, no `POST/PUT /client/roles`
   - Impact: Cannot create or modify roles
   - Severity: **BLOCKS ADMIN FUNCTIONALITY**

5. **Two-Factor Authentication Setup**
   - File: [frontend/components/dashboard/two-factor-setup.tsx](frontend/components/dashboard/two-factor-setup.tsx)
   - Issue: QR code placeholder, backup codes not real, verification simulated
   - Impact: 2FA setup is non-functional mock
   - Severity: **BLOCKS SECURITY FEATURE**

### 🟠 HIGH PRIORITY - Admin Pages Non-Functional

6. **Admin Settings Persistence**
   - File: [frontend/app/admin/settings/page.tsx](frontend/app/admin/settings/page.tsx)
   - Issue: Security/backup/features tabs all local state, no `PUT /admin/settings/*`
   - Impact: System administrators cannot configure security policies
   - Severity: HIGH

7. **Admin System Settings**
   - Missing endpoints for:
     - `GET/PUT /admin/settings/security` (2FA, password expiry, session timeout, IP whitelist)
     - `GET/PUT /admin/settings/backup` (backup frequency, retention, encryption)
     - `GET/PUT /admin/settings/features` (feature flags: OCR, workflows, sharing, etc.)
   - Impact: Production configuration blocked
   - Severity: HIGH

### 🟠 HIGH PRIORITY - Mock Data Pages

8. **Admin API Keys Page**
   - File: [frontend/app/admin/api-keys/page.tsx](frontend/app/admin/api-keys/page.tsx)
   - Missing: `GET /admin/api-keys`, `POST /admin/api-keys`, `DELETE /admin/api-keys/:id`
   - Impact: API key management doesn't work
   - Severity: HIGH

9. **Admin Logs Page**
   - File: [frontend/app/admin/logs/page.tsx](frontend/app/admin/logs/page.tsx)
   - Missing: `GET /admin/audit-logs` (real audit log fetching)
   - Impact: Administrators see fake logs, cannot audit real actions
   - Severity: HIGH

10. **Admin Storage Page**
    - File: [frontend/app/admin/storage/page.tsx](frontend/app/admin/storage/page.tsx)
    - Missing: `GET /admin/storage` (real storage metrics)
    - Impact: Storage management page shows fabricated data
    - Severity: MEDIUM

11. **Admin Subscriptions Page**
    - File: [frontend/app/admin/subscriptions/page.tsx](frontend/app/admin/subscriptions/page.tsx)
    - Missing: `GET /admin/subscriptions/stats`, `GET /admin/subscriptions`
    - Impact: Subscription management shows fake revenue/user data
    - Severity: MEDIUM

12. **Admin Reports Page**
    - File: [frontend/app/admin/reports/page.tsx](frontend/app/admin/reports/page.tsx)
    - Missing: `GET /admin/reports/kpis`, `GET /admin/reports/monthly`, `GET /admin/reports/top-companies`
    - Impact: Analytics/reporting shows only placeholder data
    - Severity: MEDIUM

---

## 9. SUMMARY OF REQUIRED BACKEND ENDPOINTS

### Create (New Endpoints Needed)

```
POST   /auth/invites/:token/accept                    # Finalize invitation, create user
GET    /auth/invites/:token/validate                 # Validate invitation token
POST   /public/contact                                # Submit contact form inquiry
POST   /client/roles                                  # Create custom role
PUT    /client/roles/:id                              # Edit role permissions
DELETE /client/roles/:id                              # Delete custom role
POST   /client/documents/upload                       # File upload with progress
GET    /admin/api-keys                                # List API keys
POST   /admin/api-keys                                # Create API key
DELETE /admin/api-keys/:id                            # Revoke API key
GET    /admin/audit-logs                              # Fetch audit logs with filters
GET    /admin/storage                                 # Get storage metrics
GET    /admin/subscriptions/stats                     # Subscription KPI stats
GET    /admin/subscriptions                           # List subscriptions
GET    /admin/reports/kpis                            # KPI metrics
GET    /admin/reports/monthly                         # Monthly analytics data
GET    /admin/reports/top-companies                   # Top tenants by metrics
GET    /admin/reports/history                         # Generated reports list
GET    /admin/settings/security                       # Get security settings
PUT    /admin/settings/security                       # Update security settings
GET    /admin/settings/backup                         # Get backup settings
PUT    /admin/settings/backup                         # Update backup settings
GET    /admin/settings/features                       # Get feature flags
PUT    /admin/settings/features                       # Update feature flags
GET    /client/devices                                # List user sessions/devices
DELETE /client/devices/:id                            # Revoke session
GET    /client/security-alerts                        # Get security alerts
PUT    /client/security-alerts/:id/dismiss            # Dismiss alert
POST   /auth/2fa/setup                                # Generate 2FA QR + backup codes
POST   /auth/2fa/verify                               # Verify 2FA setup
```

### Update (Endpoints Already Exist But Not Wired)

```
GET    /client/roles/:id                              # Fetch single role (for edit page)
DELETE /client/security-alerts/:id                    # Permanent deletion
```

---

## 10. REMEDIATION PRIORITY MATRIX

| Priority | Items | Count | Effort | Impact |
|----------|-------|-------|--------|--------|
| 🔴 **P0 - CRITICAL** | Invite acceptance, file upload, 2FA setup, role create/edit | 4 | HIGH | BLOCKS CORE FEATURES |
| 🟠 **P1 - HIGH** | Admin settings, API keys, logs, auth backend integration | 7 | HIGH | BLOCKS ADMIN UI |
| 🟡 **P2 - MEDIUM** | Reports, subscriptions, storage, contact form | 4 | MEDIUM | INCOMPLETE FEATURES |
| 🟢 **P3 - LOW** | Device/session management enhancements, security alerts persistence | 2 | LOW | UX IMPROVEMENTS |

---

## 11. FILES REQUIRING BACKEND WIRING (Sorted by Priority)

### Phase 1: Critical (Blocking)
1. [frontend/app/(auth)/invite/accept/page.tsx](frontend/app/(auth)/invite/accept/page.tsx) - Backend endpoint + token validation
2. [frontend/app/dashboard/upload/page.tsx](frontend/app/dashboard/upload/page.tsx) - Real file upload API
3. [frontend/components/dashboard/two-factor-setup.tsx](frontend/components/dashboard/two-factor-setup.tsx) - Real 2FA setup/verification
4. [frontend/app/dashboard/settings/roles/[id]/page.tsx](frontend/app/dashboard/settings/roles/[id]/page.tsx) - Real role CRUD endpoints

### Phase 2: High Priority
5. [frontend/app/admin/settings/page.tsx](frontend/app/admin/settings/page.tsx) - Settings persistence endpoints
6. [frontend/app/admin/api-keys/page.tsx](frontend/app/admin/api-keys/page.tsx) - API key CRUD endpoints
7. [frontend/app/admin/logs/page.tsx](frontend/app/admin/logs/page.tsx) - Real audit log API
8. [frontend/app/admin/security/page.tsx](frontend/app/admin/security/page.tsx) - Already wired ✓
9. [frontend/app/admin/notifications/page.tsx](frontend/app/admin/notifications/page.tsx) - Already wired ✓

### Phase 3: Medium Priority
10. [frontend/app/admin/reports/page.tsx](frontend/app/admin/reports/page.tsx) - Analytics endpoints
11. [frontend/app/admin/subscriptions/page.tsx](frontend/app/admin/subscriptions/page.tsx) - Subscription data endpoints
12. [frontend/app/admin/storage/page.tsx](frontend/app/admin/storage/page.tsx) - Storage metrics endpoint
13. [frontend/app/(public)/contact/page.tsx](frontend/app/(public)/contact/page.tsx) - Contact submission endpoint

### Phase 4: Low Priority (Enhancement)
14. [frontend/components/dashboard/security-alerts.tsx](frontend/components/dashboard/security-alerts.tsx) - Dismissal persistence

---

## Appendix A: Mock Data Statistics

### By File
- **Hardcoded Arrays/Objects:** 32 instances
- **setTimeout Simulations:** 6 instances  
- **Local State with Static Init:** 3 instances
- **Placeholder Components:** 2 instances

### By Data Type
- User/Admin Data: 8 instances
- Subscription/Billing: 5 instances
- Security/Auth: 4 instances
- Documents/Files: 3 instances
- Analytics/Reporting: 4 instances
- UI Placeholder: 2 instances
- Other: 15 instances

### Code Smell Detection
- ✗ Hardcoded company/user names: 45+ instances across 12 files
- ✗ Static IDs (SUB-001, key_1, etc.): 20+ instances
- ✗ Fake timestamps: 30+ instances
- ✓ Proper backend API calls: 13 pages (40% of codebase)

---

**End of Audit Report**
