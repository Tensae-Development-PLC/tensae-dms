'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Monitor,
  MapPin,
  Clock,
  Ban,
  Plus,
  Trash2,
  Users,
  LogOut,
  Key,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export default function SecurityPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [forceLogoutAllOpen, setForceLogoutAllOpen] = useState(false)
  const [massResetOpen, setMassResetOpen] = useState(false)
  const [addIPDialogOpen, setAddIPDialogOpen] = useState(false)
  const [ipType, setIPType] = useState<'block' | 'whitelist'>('block')
  const [newIP, setNewIP] = useState('')
  const [newIPReason, setNewIPReason] = useState('')
  const [ipActionLoading, setIpActionLoading] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ activeSessions: number; failedLogins24h: number; blockedIps: number; securityAlerts24h: number } | null>(null)
  const [loginActivity, setLoginActivity] = useState<Array<{ id: string; user: string; name: string; ip: string; device: string; location: string; status: 'success' | 'failed'; timestamp: string }>>([])
  const [failedAttempts, setFailedAttempts] = useState<Array<{ ip: string; attempts: number; lastAttempt: string; status: 'blocked' | 'warning'; user: string }>>([])
  const [blockedIPs, setBlockedIPs] = useState<Array<{ id: string; ip: string; reason: string; blockedAt: string; attempts: number }>>([])
  const [whitelistedIPs, setWhitelistedIPs] = useState<Array<{ id: string; ip: string; description: string; addedAt: string }>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const { getAdminSecurityOverview, getAdminLoginActivity, getAdminFailedAttempts, getAdminIpRules } = await import('@/lib/admin-security')
        const [overview, activity] = await Promise.all([
          getAdminSecurityOverview(),
          getAdminLoginActivity(100),
        ])
        const [attempts, rules] = await Promise.all([
          getAdminFailedAttempts(),
          getAdminIpRules(),
        ])
        if (cancelled) return
        setStats(overview)
        setLoginActivity(
          activity.map((a) => ({
            id: a.id,
            user: a.user ?? 'Unknown',
            name: a.name ?? 'Unknown',
            ip: a.ip ?? 'Unknown',
            device: a.userAgent ? a.userAgent.split(')')[0]?.replace('Mozilla/5.0 (', '') ?? 'Unknown' : 'Unknown',
            location: 'Unknown',
            status: a.status,
            timestamp: new Date(a.timestamp).toLocaleString(),
          }))
        )
        setFailedAttempts(attempts)
        setBlockedIPs(
          rules.blocked.map((r) => ({
            id: r.id,
            ip: r.ipCidr,
            reason: r.reason ?? 'Blocked',
            blockedAt: new Date(r.createdAt).toLocaleString(),
            attempts: 0,
          }))
        )
        setWhitelistedIPs(
          rules.whitelisted.map((r) => ({
            id: r.id,
            ip: r.ipCidr,
            description: r.description ?? 'Whitelisted',
            addedAt: new Date(r.createdAt).toLocaleDateString(),
          }))
        )
        setIsLoading(false)
      } catch (e) {
        if (cancelled) return
        setIsLoading(false)
        setLoadError('Failed to load security data')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const statCards = useMemo(() => {
    const s = stats ?? { activeSessions: 0, failedLogins24h: 0, blockedIps: 0, securityAlerts24h: 0 }
    return [
      { label: 'Active Sessions', value: String(s.activeSessions), icon: Users },
      { label: 'Failed Logins (24h)', value: String(s.failedLogins24h), icon: XCircle },
      { label: 'Blocked IPs', value: String(s.blockedIps), icon: Ban },
      { label: 'Security Alerts', value: String(s.securityAlerts24h), icon: AlertTriangle },
    ]
  }, [stats])

  const filteredActivity = loginActivity.filter(entry => {
    const matchesSearch = entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.ip.includes(searchQuery) ||
                         entry.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || entry.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddIpRule = async () => {
    if (!newIP.trim()) return
    setIpActionLoading(true)
    try {
      const { createAdminIpRule, getAdminIpRules } = await import('@/lib/admin-security')
      await createAdminIpRule({
        type: ipType === 'block' ? 'BLOCK' : 'WHITELIST',
        ipCidr: newIP.trim(),
        reason: ipType === 'block' ? (newIPReason.trim() || undefined) : undefined,
        description: ipType === 'whitelist' ? (newIPReason.trim() || undefined) : undefined,
      })
      const rules = await getAdminIpRules()
      setBlockedIPs(
        rules.blocked.map((r) => ({
          id: r.id,
          ip: r.ipCidr,
          reason: r.reason ?? 'Blocked',
          blockedAt: new Date(r.createdAt).toLocaleString(),
          attempts: 0,
        }))
      )
      setWhitelistedIPs(
        rules.whitelisted.map((r) => ({
          id: r.id,
          ip: r.ipCidr,
          description: r.description ?? 'Whitelisted',
          addedAt: new Date(r.createdAt).toLocaleDateString(),
        }))
      )
      setAddIPDialogOpen(false)
      setNewIP('')
      setNewIPReason('')
    } catch (e) {
      // rely on inline error UI elsewhere
    } finally {
      setIpActionLoading(false)
    }
  }

  const handleDeleteIpRule = async (id: string) => {
    setIpActionLoading(true)
    try {
      const { deleteAdminIpRule, getAdminIpRules } = await import('@/lib/admin-security')
      await deleteAdminIpRule(id)
      const rules = await getAdminIpRules()
      setBlockedIPs(
        rules.blocked.map((r) => ({
          id: r.id,
          ip: r.ipCidr,
          reason: r.reason ?? 'Blocked',
          blockedAt: new Date(r.createdAt).toLocaleString(),
          attempts: 0,
        }))
      )
      setWhitelistedIPs(
        rules.whitelisted.map((r) => ({
          id: r.id,
          ip: r.ipCidr,
          description: r.description ?? 'Whitelisted',
          addedAt: new Date(r.createdAt).toLocaleDateString(),
        }))
      )
    } finally {
      setIpActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Security Center</h1>
          <p className="text-muted-foreground">Monitor and manage system security</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMassResetOpen(true)}>
            <Key className="w-4 h-4 mr-2" />
            Mass Password Reset
          </Button>
          <Button variant="destructive" onClick={() => setForceLogoutAllOpen(true)}>
            <LogOut className="w-4 h-4 mr-2" />
            Force Logout All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.label.includes('Failed') || stat.label.includes('Alert') 
                      ? 'bg-destructive/10' 
                      : 'bg-primary/10'
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.label.includes('Failed') || stat.label.includes('Alert') 
                        ? 'text-destructive' 
                        : 'text-primary'
                    }`} />
                  </div>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  {isLoading ? 'Loading…' : 'Last 24h'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {loadError && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity">Login Activity</TabsTrigger>
          <TabsTrigger value="failed">Failed Attempts</TabsTrigger>
          <TabsTrigger value="ips">IP Management</TabsTrigger>
        </TabsList>

        {/* Login Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Login Activity Log</CardTitle>
                <CardDescription>Recent authentication attempts across the system</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users, IPs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      {statusFilter || 'All'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>All</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('success')}>Success</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('failed')}>Failed</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredActivity.map((entry) => (
                  <div 
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.status === 'failed' 
                        ? 'bg-destructive/5 border border-destructive/10' 
                        : 'bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        entry.status === 'success' 
                          ? 'bg-accent/10' 
                          : 'bg-destructive/10'
                      }`}>
                        {entry.status === 'success' 
                          ? <CheckCircle className="w-5 h-5 text-accent" />
                          : <XCircle className="w-5 h-5 text-destructive" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{entry.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.user}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="w-4 h-4" />
                        {entry.device}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {entry.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-muted-foreground">{entry.ip}</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Attempts Tab */}
        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Failed Login Attempts</CardTitle>
              <CardDescription>IPs with multiple failed authentication attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failedAttempts.map((entry, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.status === 'blocked' 
                        ? 'bg-destructive/5 border border-destructive/10' 
                        : 'bg-yellow-500/5 border border-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        entry.status === 'blocked' 
                          ? 'bg-destructive/10' 
                          : 'bg-yellow-500/10'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          entry.status === 'blocked' 
                            ? 'text-destructive' 
                            : 'text-yellow-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-mono font-medium text-foreground">{entry.ip}</p>
                        <p className="text-sm text-muted-foreground">Target: {entry.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{entry.attempts}</p>
                        <p className="text-xs text-muted-foreground">attempts</p>
                      </div>
                      <Badge variant={entry.status === 'blocked' ? 'destructive' : 'secondary'}>
                        {entry.status}
                      </Badge>
                      {entry.status !== 'blocked' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIPType('block')
                            setNewIP(entry.ip)
                            setNewIPReason('Brute force protection')
                            setAddIPDialogOpen(true)
                          }}
                          disabled={ipActionLoading}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Block
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Management Tab */}
        <TabsContent value="ips" className="space-y-6">
          {/* Blocked IPs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  Blocked IPs
                </CardTitle>
                <CardDescription>IPs that are denied access to the system</CardDescription>
              </div>
              <Button variant="outline" onClick={() => {
                setIPType('block')
                setAddIPDialogOpen(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Block IP
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blockedIPs.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div>
                      <p className="font-mono font-medium text-foreground">{entry.ip}</p>
                      <p className="text-sm text-muted-foreground">{entry.reason}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Blocked: {entry.blockedAt}</p>
                        {entry.attempts > 0 && <p>{entry.attempts} attempts</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteIpRule(entry.id)}
                        disabled={ipActionLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Whitelisted IPs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Whitelisted IPs
                </CardTitle>
                <CardDescription>Trusted IP ranges that bypass rate limiting</CardDescription>
              </div>
              <Button variant="outline" onClick={() => {
                setIPType('whitelist')
                setAddIPDialogOpen(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Whitelist
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {whitelistedIPs.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <div>
                      <p className="font-mono font-medium text-foreground">{entry.ip}</p>
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Added: {entry.addedAt}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteIpRule(entry.id)}
                        disabled={ipActionLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Force Logout All Dialog */}
      <AlertDialog open={forceLogoutAllOpen} onOpenChange={setForceLogoutAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Force Logout All Users
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate ALL active sessions across the entire system. 
              Every user will need to log in again. This action should only be used in emergencies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Force Logout All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mass Password Reset Dialog */}
      <AlertDialog open={massResetOpen} onOpenChange={setMassResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Mass Password Reset
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send password reset emails to ALL users in the system. 
              Users will be required to set a new password on their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>
              <Key className="w-4 h-4 mr-2" />
              Send Reset Emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add IP Dialog */}
      <Dialog open={addIPDialogOpen} onOpenChange={setAddIPDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ipType === 'block' ? 'Block IP Address' : 'Add to Whitelist'}
            </DialogTitle>
            <DialogDescription>
              {ipType === 'block' 
                ? 'Enter an IP address or range to block from accessing the system'
                : 'Enter a trusted IP address or range to whitelist'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip-address">IP Address or CIDR Range</Label>
              <Input
                id="ip-address"
                placeholder="e.g., 192.168.1.100 or 192.168.1.0/24"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{ipType === 'block' ? 'Reason for blocking' : 'Description'}</Label>
              <Input
                id="reason"
                placeholder={ipType === 'block' ? 'e.g., Suspicious activity' : 'e.g., Office Network'}
                value={newIPReason}
                onChange={(e) => setNewIPReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddIPDialogOpen(false)}>Cancel</Button>
            <Button
              variant={ipType === 'block' ? 'destructive' : 'default'}
              onClick={handleAddIpRule}
              disabled={ipActionLoading || !newIP.trim()}
            >
              {ipType === 'block' ? 'Block IP' : 'Add to Whitelist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
