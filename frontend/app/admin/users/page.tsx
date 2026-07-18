'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCog,
  Eye,
  Key,
  Ban,
  LogOut,
  History,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { listAdminUsers } from '@/lib/client-api'

interface User {
  id: string
  name: string
  email: string
  company: string
  role: string
  status: 'active' | 'inactive' | 'suspended' | string
  lastActive: string
  lastLogin: string
  loginIp: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // Load users from admin API
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const list = await listAdminUsers()
        if (!mounted) return
        setUsers(list.map(u => ({
          id: u.id,
          name: u.name ?? u.email,
          email: u.email,
          company: u.company ?? '',
          role: u.role ?? '',
          status: (u.status as any) || 'active',
          lastActive: u.lastActive ?? '',
          lastLogin: u.lastLogin ?? '',
          loginIp: u.loginIp ?? '',
        })))
      } catch (e) {
        if (!mounted) return
        setErr(e instanceof Error ? e.message : 'Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [forceLogoutDialogOpen, setForceLogoutDialogOpen] = useState(false)
  const [loginHistoryDialogOpen, setLoginHistoryDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loginHistory, setLoginHistory] = useState<{ date: string; device: string; ip: string; location?: string; status: string }[]>([])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'primary' },
    { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, icon: Shield, color: 'destructive' },
    { label: 'Managers', value: users.filter(u => u.role === 'Manager').length, icon: UserCog, color: 'accent' },
    { label: 'Viewers', value: users.filter(u => u.role === 'Viewer').length, icon: Eye, color: 'chart-4' },
  ]

  const handleResetPassword = () => {
    // In real app, send password reset email
    setResetPasswordDialogOpen(false)
    setSelectedUser(null)
  }

  const handleDisableAccount = () => {
    if (selectedUser) {
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: 'suspended' as const }
          : u
      ))
      setDisableDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const handleForceLogout = () => {
    // In real app, terminate all sessions
    setForceLogoutDialogOpen(false)
    setSelectedUser(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage users across all organizations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              {roleFilter || 'All Roles'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setRoleFilter(null)}>All Roles</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setRoleFilter('Admin')}>Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('Manager')}>Manager</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('Viewer')}>Viewer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">User</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">Company</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden lg:table-cell">Last Active</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${
                          user.status === 'suspended' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{user.company}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        user.role === 'Admin' ? 'destructive' :
                        user.role === 'Manager' ? 'default' :
                        'secondary'
                      }>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <Badge variant={
                        user.status === 'active' ? 'default' :
                        user.status === 'inactive' ? 'secondary' :
                        'destructive'
                      } className={
                        user.status === 'active' ? 'bg-accent text-accent-foreground' : ''
                      }>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{user.lastActive}</span>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setResetPasswordDialogOpen(true)
                          }}>
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setForceLogoutDialogOpen(true)
                          }}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Force Logout
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setLoginHistoryDialogOpen(true)
                          }}>
                            <History className="w-4 h-4 mr-2" />
                            Login History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedUser(user)
                              setDisableDialogOpen(true)
                            }}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Disable Account
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Reset Password
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send a password reset email to {selectedUser?.email}? 
              The user will receive instructions to create a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              Send Reset Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable Account Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Disable Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable {selectedUser?.name}&apos;s account? 
              They will be immediately logged out and unable to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisableAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disable Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Logout Dialog */}
      <AlertDialog open={forceLogoutDialogOpen} onOpenChange={setForceLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-primary" />
              Force Logout
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate all active sessions for {selectedUser?.name}. 
              They will need to log in again to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceLogout}>
              Force Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login History Dialog */}
      <Dialog open={loginHistoryDialogOpen} onOpenChange={setLoginHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Login History - {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Recent login activity for this account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loginHistory.map((entry, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.status === 'failed' 
                    ? 'bg-destructive/5 border border-destructive/10' 
                    : 'bg-secondary/30'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{entry.date}</p>
                  <p className="text-xs text-muted-foreground">{entry.device}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">{entry.ip}</p>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground">{entry.location}</span>
                    <Badge variant={entry.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
