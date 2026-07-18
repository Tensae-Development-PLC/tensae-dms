'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Database, 
  ToggleLeft,
  Save,
  AlertTriangle,
  Clock,
  Key,
  FileArchive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminSettingsPage() {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: true,
    passwordExpiry: '90',
    sessionTimeout: '60',
    ipWhitelist: false,
    failedLoginLockout: true,
    maxFailedAttempts: '5',
  })

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: '30',
    backupEncryption: true,
  })

  const [features, setFeatures] = useState({
    documentSharing: true,
    externalLinks: true,
    versionHistory: true,
    ocr: true,
    workflows: true,
    analytics: true,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <ToggleLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Authentication Settings
                </CardTitle>
                <CardDescription>Configure user authentication requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Require Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">All users must enable 2FA</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorRequired}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorRequired: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Password Expiry</p>
                    <p className="text-sm text-muted-foreground">Days until password must be changed</p>
                  </div>
                  <Select
                    value={securitySettings.passwordExpiry}
                    onValueChange={(value) => setSecuritySettings({ ...securitySettings, passwordExpiry: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Inactive session timeout duration</p>
                  </div>
                  <Select
                    value={securitySettings.sessionTimeout}
                    onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-accent" />
                  Login Security
                </CardTitle>
                <CardDescription>Configure login attempt restrictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">IP Whitelist</p>
                    <p className="text-sm text-muted-foreground">Restrict access to specific IPs</p>
                  </div>
                  <Switch
                    checked={securitySettings.ipWhitelist}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, ipWhitelist: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Failed Login Lockout</p>
                    <p className="text-sm text-muted-foreground">Lock account after failed attempts</p>
                  </div>
                  <Switch
                    checked={securitySettings.failedLoginLockout}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, failedLoginLockout: checked })}
                  />
                </div>

                {securitySettings.failedLoginLockout && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Max Failed Attempts</p>
                      <p className="text-sm text-muted-foreground">Attempts before lockout</p>
                    </div>
                    <Select
                      value={securitySettings.maxFailedAttempts}
                      onValueChange={(value) => setSecuritySettings({ ...securitySettings, maxFailedAttempts: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button className="glow-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileArchive className="w-5 h-5 text-primary" />
                  Backup Configuration
                </CardTitle>
                <CardDescription>Configure automatic backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Automatic Backups</p>
                    <p className="text-sm text-muted-foreground">Enable scheduled automatic backups</p>
                  </div>
                  <Switch
                    checked={backupSettings.autoBackup}
                    onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, autoBackup: checked })}
                  />
                </div>

                {backupSettings.autoBackup && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Backup Frequency</p>
                        <p className="text-sm text-muted-foreground">How often to run backups</p>
                      </div>
                      <Select
                        value={backupSettings.backupFrequency}
                        onValueChange={(value) => setBackupSettings({ ...backupSettings, backupFrequency: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Retention Period</p>
                        <p className="text-sm text-muted-foreground">How long to keep backups</p>
                      </div>
                      <Select
                        value={backupSettings.backupRetention}
                        onValueChange={(value) => setBackupSettings({ ...backupSettings, backupRetention: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Backup Encryption</p>
                    <p className="text-sm text-muted-foreground">Encrypt backup files</p>
                  </div>
                  <Switch
                    checked={backupSettings.backupEncryption}
                    onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, backupEncryption: checked })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button className="glow-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Save Backup Settings
                  </Button>
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Run Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="w-5 h-5 text-primary" />
                  Feature Toggles
                </CardTitle>
                <CardDescription>Enable or disable system features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'documentSharing', label: 'Document Sharing', description: 'Allow users to share documents internally' },
                  { key: 'externalLinks', label: 'External Sharing Links', description: 'Allow creation of external share links' },
                  { key: 'versionHistory', label: 'Version History', description: 'Track document version history' },
                  { key: 'ocr', label: 'OCR Processing', description: 'Automatic text extraction from images' },
                  { key: 'workflows', label: 'Workflow Automation', description: 'Document approval workflows' },
                  { key: 'analytics', label: 'Analytics Dashboard', description: 'Usage analytics and reporting' },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{feature.label}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Switch
                      checked={features[feature.key as keyof typeof features]}
                      onCheckedChange={(checked) => setFeatures({ ...features, [feature.key]: checked })}
                    />
                  </div>
                ))}

                <Button className="glow-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Feature Settings
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
