'use client'

import { motion } from 'framer-motion'
import { Shield, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Platform configuration for this deployment</p>
      </div>

      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Configure via environment</p>
            <p className="text-muted-foreground mt-1">
              Runtime settings are controlled by server env vars (
              <code className="text-xs">JWT_*</code>, <code className="text-xs">CORS_ORIGIN</code>,{' '}
              <code className="text-xs">STORAGE_LOCAL_ROOT</code>, <code className="text-xs">BILLING_ENABLED</code>,
              SMTP, Redis). Use Security for IP allow/deny rules and tenant Settings for retention /
              session preferences.
            </p>
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              What is enforced today
            </CardTitle>
            <CardDescription>Live controls already wired in the API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Auth rate limiting and failed-login lockout (5 attempts / 15 minutes)</p>
            <p>• Global IP block / whitelist rules (Security page)</p>
            <p>• Session timeout from user preferences (refresh token absolute expiry)</p>
            <p>• Document retention purge job (tenant <code className="text-xs">retentionDays</code>)</p>
            <p>• Tenant role-code ACL and platform sysadmin JWT (separate from tenant roles)</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
