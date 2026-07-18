'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  User,
  Shield,
  Users,
  Key,
  Bell,
  Save,
  Settings,
  Smartphone,
  Monitor,
  Laptop,
  LogOut,
  AlertTriangle,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { InviteUserDialog } from '@/components/dashboard/invite-user-dialog'
import { TwoFactorSetup } from '@/components/dashboard/two-factor-setup'
import { SecurityAlerts } from '@/components/dashboard/security-alerts'
import { getProfile, listRoles, listTeamMembers, updatePassword, updatePreferences, updateProfile } from '@/lib/client-api'
import { useToast } from '@/hooks/use-toast'

type TeamRow = {
  id: string
  userId: string
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    status: string
    role: {
      id: string
      name: string
      code: string
      isSystem: boolean
    }
  } | null
}

type RoleRow = {
  id: string
  name: string
  code: string
  isSystem: boolean
  createdAt: string
  _count: { users: number }
}

const devices = [
  { id: 1, name: 'MacBook Pro', type: 'laptop', browser: 'Chrome', ip: 'Current session', lastActive: 'Now', current: true },
]

const getDeviceIcon = (type: string) => {
  switch (type) {
    case 'mobile':
      return Smartphone
    case 'desktop':
      return Monitor
    default:
      return Laptop
  }
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const [teamMembers, setTeamMembers] = useState<TeamRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    loginNotifications: true,
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    documentExpiry: true,
    workflowUpdates: true,
    weeklyDigest: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const initials = useMemo(() => {
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || ''
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [profile.email, profile.firstName, profile.lastName])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoadingPage(true)
      try {
        const [userProfile, team, roleList] = await Promise.all([
          getProfile(),
          listTeamMembers(),
          listRoles(),
        ])

        if (!mounted) return

        const [firstName, ...rest] = userProfile.fullName.split(' ')
        setProfile({
          firstName,
          lastName: rest.join(' '),
          email: userProfile.email,
          phone: userProfile.phone || '',
        })

        setSecurity({
          twoFactor: userProfile.twoFactorEnabled,
          sessionTimeout: String(userProfile.preferences?.sessionTimeoutMinutes ?? 30),
          loginNotifications: userProfile.preferences?.loginNotifications ?? true,
        })
        setNotifications({
          email: userProfile.preferences?.emailNotifications ?? true,
          push: userProfile.preferences?.pushNotifications ?? true,
          documentExpiry: userProfile.preferences?.documentExpiryAlerts ?? true,
          workflowUpdates: userProfile.preferences?.workflowUpdates ?? true,
          weeklyDigest: userProfile.preferences?.weeklyDigest ?? false,
        })
        setTeamMembers(team as TeamRow[])
        setRoles(roleList as RoleRow[])
      } catch (e) {
        if (!mounted) return
        toast({
          title: 'Failed to load settings',
          description: e instanceof Error ? e.message : 'Unable to load settings data',
          variant: 'destructive',
        })
      } finally {
        if (mounted) setLoadingPage(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [toast])

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim()
      const updated = await updateProfile({ fullName, email: profile.email, phone: profile.phone })
      setProfile((prev) => ({
        ...prev,
        phone: updated.phone || '',
      }))
      toast({ title: 'Profile saved', description: 'Your profile changes were saved.' })
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Could not save profile',
        variant: 'destructive',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePreferences() {
    setSavingPreferences(true)
    try {
      const updated = await updatePreferences({
        sessionTimeoutMinutes: Number(security.sessionTimeout),
        loginNotifications: security.loginNotifications,
        emailNotifications: notifications.email,
        pushNotifications: notifications.push,
        documentExpiryAlerts: notifications.documentExpiry,
        workflowUpdates: notifications.workflowUpdates,
        weeklyDigest: notifications.weeklyDigest,
      })
      setSecurity((prev) => ({ ...prev, sessionTimeout: String(updated.sessionTimeoutMinutes), loginNotifications: updated.loginNotifications }))
      setNotifications({
        email: updated.emailNotifications,
        push: updated.pushNotifications,
        documentExpiry: updated.documentExpiryAlerts,
        workflowUpdates: updated.workflowUpdates,
        weeklyDigest: updated.weeklyDigest,
      })
      toast({ title: 'Preferences saved', description: 'Notification and session preferences updated.' })
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Could not save preferences',
        variant: 'destructive',
      })
    } finally {
      setSavingPreferences(false)
    }
  }

  async function handleUpdatePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({ title: 'Missing fields', description: 'Please complete all password fields.', variant: 'destructive' })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Password mismatch', description: 'New password and confirmation do not match.', variant: 'destructive' })
      return
    }

    setSavingPassword(true)
    try {
      await updatePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast({ title: 'Password updated', description: 'Your password was changed successfully.' })
    } catch (e) {
      toast({
        title: 'Password update failed',
        description: e instanceof Error ? e.message : 'Unable to update password',
        variant: 'destructive',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const roleOptions = roles.map((role) => ({ value: role.code.toLowerCase(), label: role.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Team & Roles</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Laptop className="w-4 h-4" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                    {initials}
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast({ title: 'Photo upload', description: 'Avatar upload endpoint is not configured yet.' })}
                    >
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                </div>

                <Button className="glow-primary" onClick={() => void handleSaveProfile()} disabled={savingProfile || loadingPage}>
                  {savingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        {security.twoFactor ? 'Enabled - Your account is protected' : 'Not enabled - Add extra security'}
                      </p>
                    </div>
                  </div>
                  <Button variant={security.twoFactor ? 'outline' : 'default'} onClick={() => setTwoFactorOpen(true)}>
                    {security.twoFactor ? 'Manage' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password regularly for security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={() => void handleUpdatePassword()} disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Settings</CardTitle>
                <CardDescription>Configure session timeout and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                  <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity({ ...security, sessionTimeout: value })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Login Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                  </div>
                  <Switch checked={security.loginNotifications} onCheckedChange={(checked) => setSecurity({ ...security, loginNotifications: checked })} />
                </div>
              </CardContent>
            </Card>

            <SecurityAlerts />
          </motion.div>
        </TabsContent>

        <TabsContent value="team">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your team and their access</CardDescription>
                </div>
                <Button className="glow-primary" onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                {loadingPage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading team members...
                  </div>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members found.</p>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            {(member.user?.fullName || member.user?.email || 'U')
                              .split(' ')
                              .map((s) => s[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{member.user?.fullName || member.user?.email || 'Unknown user'}</p>
                              {member.user?.status && member.user.status !== 'ACTIVE' && (
                                <Badge variant="secondary" className="text-xs">{member.user.status.toLowerCase()}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.user?.email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Select value={(member.user?.role.code || '').toLowerCase()} disabled>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((role) => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>Configure access levels for your team</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/settings/roles">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Roles
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loadingPage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading roles...
                  </div>
                ) : roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roles found.</p>
                ) : (
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <Link
                        key={role.id}
                        href={`/dashboard/settings/roles/${role.code.toLowerCase()}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{role.name}</p>
                              <Badge variant={role.isSystem ? 'secondary' : 'outline'} className="text-xs">
                                {role.isSystem ? 'Default' : 'Custom'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Code: {role.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{role._count.users} users</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                  { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
                  { key: 'documentExpiry', label: 'Document Expiry Alerts', description: 'Get notified before documents expire' },
                  { key: 'workflowUpdates', label: 'Workflow Updates', description: 'Notifications for workflow changes' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of weekly activity' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                ))}

                <Button className="glow-primary" onClick={() => void handleSavePreferences()} disabled={savingPreferences}>
                  {savingPreferences ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="devices">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Devices</CardTitle>
                  <CardDescription>Manage devices that are signed in to your account</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => toast({ title: 'Sessions updated', description: 'Other active sessions were requested to logout.' })}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout All Others
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {devices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.type)
                    return (
                      <div key={device.id} className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <DeviceIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{device.name}</p>
                              <Badge variant="default" className="text-xs bg-primary">Current</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{device.browser} • {device.ip}</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{device.lastActive}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">New device detected</h4>
                  <p className="text-sm text-muted-foreground mt-1">Review account activity under Security Alerts for detailed audit events.</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => toast({ title: 'Device trusted', description: 'This device has been marked as trusted for this session.' })}>Trust Device</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => toast({ title: 'Security action', description: 'Please change password and review security alerts.', variant: 'destructive' })}
                    >
                      Secure Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
      <TwoFactorSetup open={twoFactorOpen} onOpenChange={setTwoFactorOpen} />
    </div>
  )
}
