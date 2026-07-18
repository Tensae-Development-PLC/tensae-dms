# Email System Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST                           │
│            POST /client/team/invite-email                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │   client.controller.ts              │
        │  inviteMemberByEmail()              │
        │  - Validate request                 │
        │  - Get inviter info from DB         │
        │  - Build invite URL                 │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │   job-dispatcher.service.ts         │
        │  enqueueEmail()                     │
        │  - Create idempotent job ID         │
        │  - Add to Redis queue               │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │   Redis Queue                       │
        │   Queue Name: "email"               │
        │   ✅ Running (confirmed)            │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │   worker-bootstrap.ts (EMAIL WORKER)│
        │  Processes jobs from "email" queue  │
        │  ✅ Worker Initialized              │
        │  ✅ Retry logic: 5 attempts         │
        │  ✅ Exponential backoff enabled     │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │   templates.ts                      │
        │  inviteEmailTemplate()              │
        │  - Generate subject line            │
        │  - Create HTML email body           │
        │  - Create plain text version        │
        │  ✅ Template Ready                  │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │   mailer.ts                         │
        │  sendMail()                         │
        │  - Checks SMTP configuration        │
        │  - ❌ CURRENTLY NULL/NOT CONFIGURED │
        │  - Would use nodemailer v8.0.7      │
        └────────────┬────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼ (When CONFIGURED)     ▼ (Currently)
    ┌─────────┐           ┌──────────────┐
    │  SMTP   │           │ Throws Error │
    │  Server │           │ "SMTP not    │
    │         │           │ configured"  │
    └────┬────┘           └──────┬───────┘
         │                       │
         ▼                       ▼
   ┌──────────┐          ┌──────────────┐
   │  Email   │          │ Dead Letter  │
   │  Sent ✅ │          │ Queue ❌     │
   └──────────┘          │ (After 5     │
                         │  retries)    │
                         └──────────────┘
```

## Current Status Summary

### ✅ OPERATIONAL COMPONENTS

| Component | Status | Details |
|-----------|--------|---------|
| **API Endpoint** | ✅ Ready | POST /client/team/invite-email |
| **Request Handler** | ✅ Ready | client.controller.inviteMemberByEmail() |
| **Job Dispatcher** | ✅ Ready | Enqueues to Redis "email" queue |
| **Redis Queue** | ✅ Ready | BullMQ "email" queue operational |
| **Job Worker** | ✅ Ready | Worker initialized in server.ts:9 |
| **Email Templates** | ✅ Ready | team-invite, password-reset templates |
| **Job Retry Logic** | ✅ Ready | 5 attempts, exponential backoff |
| **Dead Letter Queue** | ✅ Ready | Captures failed jobs after retries |
| **nodemailer Library** | ✅ Ready | v8.0.7 installed in package.json |

### ❌ BLOCKED COMPONENTS (Missing Configuration)

| Component | Status | Issue |
|-----------|--------|-------|
| **SMTP Transport** | ❌ NOT INITIALIZED | mailer = null (no SMTP config) |
| **Email Delivery** | ❌ BLOCKED | Throws "SMTP is not configured" |
| **User Notifications** | ❌ NOT FUNCTIONAL | Can't send invitation emails |

---

## Configuration Status

### Environment Variables (`.env`)

```
❌ MISSING: SMTP_HOST           (e.g., smtp.gmail.com)
❌ MISSING: SMTP_PORT           (e.g., 465)
❌ MISSING: SMTP_SECURE         (e.g., true)
❌ MISSING: SMTP_USER           (e.g., user@gmail.com)
❌ MISSING: SMTP_PASS           (e.g., app-password)
⚠️  OPTIONAL: SMTP_FROM         (defaults to SMTP_USER)
✅ PRESENT: PUBLIC_APP_BASE_URL (http://localhost:3000)
```

---

## What Happens When You Send an Invitation

### Current Flow (With Missing SMTP)

```
1. POST /client/team/invite-email
   ├─ ✅ Validate request data
   ├─ ✅ Fetch inviter information
   ├─ ✅ Build invitation URL
   ├─ ✅ Enqueue email job to Redis
   │
2. BullMQ Worker Processes Job
   ├─ ✅ Retrieve job from queue
   ├─ ✅ Generate email template
   ├─ ❌ Try to send via SMTP
   │  └─ Error: "SMTP is not configured"
   │
3. Job Failure & Retry
   ├─ ❌ Attempt 1 - FAILS
   ├─ ❌ Attempt 2 - FAILS (after 2s delay)
   ├─ ❌ Attempt 3 - FAILS (after 4s delay)
   ├─ ❌ Attempt 4 - FAILS (after 8s delay)
   ├─ ❌ Attempt 5 - FAILS (after 16s delay)
   │
4. Final Disposition
   └─ Job moved to dead-letter queue
   └─ User receives API response: {"accepted": true}
      (But email was never sent!)
```

---

## After SMTP Configuration

```
1. POST /client/team/invite-email
   ├─ ✅ Validate request data
   ├─ ✅ Fetch inviter information
   ├─ ✅ Build invitation URL
   ├─ ✅ Enqueue email job to Redis
   │
2. BullMQ Worker Processes Job
   ├─ ✅ Retrieve job from queue
   ├─ ✅ Generate email template
   ├─ ✅ Send via SMTP (first attempt)
   │
3. Successful Delivery
   └─ Email sent to recipient
   └─ Job removed from queue
   └─ User receives: {"accepted": true}
   └─ ✅ Email arrives in inbox (5-30s)
```

---

## Testing Flow

```
┌──────────────────┐
│  Admin Login     │ ✅ Get JWT token
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  POST /team/invite-email             │ ✅ Endpoint accessible
│  {                                   │
│    email: "user@example.com",        │
│    role: "MEMBER",                   │
│    department: "Engineering"         │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  API Response: {"accepted": true}    │ ✅ Always returns true
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Check Redis Queue                   │ ⚠️  Job enqueued
│  redis-cli LLEN bull:email:1         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Wait 5-10 seconds                   │ ⏱️  Processing time
└────────┬─────────────────────────────┘
         │
         ▼
    ┌────┴────┐
    │          │
    ▼          ▼
❌ FAILS    ✅ SUCCEEDS
Job in      Email in
dead-letter inbox
queue
```

---

## Key Code Locations

| File | Purpose | Status |
|------|---------|--------|
| `server/.env` | Environment config | ❌ SMTP vars missing |
| `server/src/config/env.ts` | Config schema | ✅ Ready |
| `server/src/common/email/mailer.ts` | SMTP init | ❌ Returns null |
| `server/src/common/email/templates.ts` | Email templates | ✅ Ready |
| `server/src/jobs/workers/worker-bootstrap.ts` | Email worker | ✅ Ready |
| `server/src/jobs/services/job-dispatcher.service.ts` | Job queueing | ✅ Ready |
| `server/src/jobs/queues/queue-registry.ts` | Queue setup | ✅ Ready |
| `server/src/modules/client/controllers/client.controller.ts` (L~158) | Invite endpoint | ✅ Ready |

---

## Next Steps Priority

1. **IMMEDIATE** (Blocks email): Add SMTP config to `.env`
2. **URGENT** (Testing): Restart server to load env vars
3. **IMPORTANT** (Verification): Send test invitation and verify delivery
4. **RECOMMENDED** (Monitoring): Check dead-letter queue regularly

See `SMTP_SETUP_GUIDE.md` for detailed setup instructions.
