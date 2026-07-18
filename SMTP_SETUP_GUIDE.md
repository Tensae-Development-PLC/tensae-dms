# Email/SMTP Setup & Testing Guide

## 📊 Current Status

### ✅ What's Already Configured
- Email service infrastructure: **Complete**
  - BullMQ job queue (Redis-backed)
  - nodemailer library (v8.0.7)
  - Email templates (team invitations, password reset)
  - Job workers with retry logic (5 attempts, exponential backoff)
  - Endpoints for sending invitations
  
### ❌ What's Missing
- **SMTP credentials in `.env` file** - All configuration variables are absent
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM` (optional)

**Current State**: Email jobs are being enqueued but fail immediately because SMTP is not configured.

---

## 🔧 Setup Instructions

### Step 1: Choose Your Email Provider

#### Option A: Gmail (Recommended for Testing)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already enabled)
3. Create an App Password:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer"
   - Generate a 16-character password
   - Copy this password

#### Option B: Other SMTP Providers
Use your provider's SMTP settings:
- **SendGrid**: SMTP Host: `smtp.sendgrid.net`, Port: `587` (secure: false)
- **Mailgun**: SMTP Host: `smtp.mailgun.org`, Port: `587` (secure: false)
- **AWS SES**: Use your configured SMTP credentials
- **Postmark**: SMTP Host: `smtp.postmarkapp.com`, Port: `465` (secure: true)

### Step 2: Update `.env` File

Edit `server/.env` and add these lines:

```env
# Gmail Example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=DMS Support <your-email@gmail.com>
PUBLIC_APP_BASE_URL=http://localhost:3000

# For production, also update PUBLIC_APP_BASE_URL:
# PUBLIC_APP_BASE_URL=https://yourdomain.com
```

**Important**: 
- Don't use your Google account password - use the App Password instead
- `SMTP_FROM` is optional (defaults to `SMTP_USER`)
- Keep credentials secure - never commit `.env` to version control

### Step 3: Verify Environment Variables

```powershell
# Check that Redis is running
redis-cli ping
# Should output: PONG

# Check your .env file was updated
Get-Content server\.env | Select-String "SMTP"
# Should show your SMTP configuration
```

### Step 4: Restart the Server

The server needs to restart to load the new environment variables:

```powershell
# If running with npm
# Stop the current server (Ctrl+C in the terminal)

# Then restart
cd server
npm run dev
# Or for production: npm start
```

The server logs should show:
```
Server running, port: 4000
BullMQ workers initialized, workers: 4
```

---

## 🧪 Testing the Email Service

### Test 1: API Endpoint Test (via curl/Postman)

1. First, get your auth token (admin login)
2. Send an invitation request:

```bash
# Powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}

$body = @{
    email = "testuser@example.com"
    role = "MEMBER"
    department = "Engineering"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/v1/client/team/invite-email" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

Expected response:
```json
{"accepted": true}
```

### Test 2: Monitor Job Queue

While the server is running and you've sent an invitation:

```powershell
# Connect to Redis and check the email queue
redis-cli

# In Redis CLI:
> KEYS *email*
# Should show: "bull:email:*" queues

# Check pending jobs
> LLEN bull:email:1
# Shows count of jobs in queue

# Check failed jobs
> LLEN bull:email:failed
# Should be 0 if SMTP is configured correctly

# Check dead-letter queue
> LLEN bull:dead-letter:*
# Should be 0 (or low if retries are exhausted)
```

### Test 3: Check Email Received

After sending an invitation via the API:
1. Wait 5-10 seconds for job processing
2. Check the email inbox for:
   - **From**: Your `SMTP_FROM` address
   - **Subject**: "You're invited to join [Company Name]"
   - **Content**: Includes company name, role, invited by info, and accept invitation link

### Test 4: Verify Job Retry Logic

If you deliberately use wrong SMTP credentials:
1. Job is retried 5 times
2. Exponential backoff: 2s, 4s, 8s, 16s, 32s (total ~62s)
3. After 5 failed attempts, job moves to dead-letter queue
4. Check logs for: `"Job failed", "queue": "email"`

---

## 🔍 Troubleshooting

### "SMTP is not configured" Error

**Cause**: Environment variables not loaded

**Solution**:
```powershell
# Verify all SMTP variables are in .env
Get-Content server\.env | Select-String "SMTP_"

# Restart server (kill and restart the process)
```

### Job Stays in Queue / Doesn't Process

**Cause**: Worker not running

**Solution**:
```powershell
# Check server logs for "BullMQ workers initialized"
# If missing, workers didn't start - check for startup errors

# Verify Redis connection
redis-cli ping
```

### Email Not Received After 1 Minute

**Causes**:
1. Check SMTP_USER/SMTP_PASS are correct
2. Gmail: Verify App Password (not main password)
3. SMTP_PORT might be wrong (try 587 for TLS, 465 for SSL)
4. Check spam/junk folder

**Debug**:
```powershell
# Check dead-letter queue for failed jobs
redis-cli LRANGE bull:dead-letter:0 -1 | head -1

# Failed job contains error message indicating what went wrong
```

### Job Processed but Email Not Received

**Possible causes**:
1. Email marked as spam (check spam folder)
2. Sender domain not verified (if using custom SMTP)
3. Email template issue (unlikely but possible)

**Solution**:
1. Add sender to contacts to whitelist
2. For custom SMTP, verify domain authentication (SPF, DKIM)
3. Check server logs for any template generation errors

---

## 📋 Implementation Checklist

- [ ] **SMTP Provider Selected** (Gmail, SendGrid, etc.)
- [ ] **Credentials Obtained** (App Password for Gmail, API keys for others)
- [ ] **`.env` File Updated** with all SMTP_* variables
- [ ] **Environment Variables Verified** (`Get-Content server\.env | Select-String "SMTP"`)
- [ ] **Redis Running** (`redis-cli ping` returns PONG)
- [ ] **Server Restarted** (to load new env variables)
- [ ] **Workers Started** (check logs for "BullMQ workers initialized")
- [ ] **Test Invitation Sent** (via API endpoint)
- [ ] **Job Enqueued** (verified in Redis)
- [ ] **Email Received** (check inbox after 5-10 seconds)
- [ ] **No Dead Letter Jobs** (`redis-cli LLEN bull:dead-letter:* ` returns 0 or low count)

---

## 🚀 Production Deployment

For production servers:

1. **Use Secure SMTP**:
   ```env
   SMTP_SECURE=true
   SMTP_PORT=465
   PUBLIC_APP_BASE_URL=https://yourdomain.com
   ```

2. **Store Secrets Safely**:
   - Use environment variables from secrets manager
   - Never commit `.env` to version control
   - Use Docker secrets for containerized deployments

3. **Monitor Email Delivery**:
   - Monitor dead-letter queue for failed jobs
   - Set up alerts for high failure rates
   - Periodically audit email logs

4. **SMTP Provider Recommendations**:
   - **SendGrid/Mailgun**: Better deliverability for scale
   - **AWS SES**: Cost-effective for high volumes
   - **Postmark**: Excellent for transactional email

---

## 📚 Related Files

- Configuration: `server/src/config/env.ts`
- Mailer: `server/src/common/email/mailer.ts`
- Templates: `server/src/common/email/templates.ts`
- Workers: `server/src/jobs/workers/worker-bootstrap.ts`
- Invitation Endpoint: `server/src/modules/client/controllers/client.controller.ts` (line ~158)
- Queue Setup: `server/src/jobs/queues/queue-registry.ts`

---

## 🎯 Next Steps

1. **Immediate**: Add SMTP configuration to `.env` and restart server
2. **Testing**: Send a test invitation and verify email received
3. **Monitoring**: Set up alerts for failed email jobs
4. **Documentation**: Update deployment runbook with SMTP setup
