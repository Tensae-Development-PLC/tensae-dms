'use client'

import { useEffect, useState } from 'react'
import { Mail, Shield, Building2, Calendar, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { inviteTeamMemberByEmail, listRoles } from '@/lib/client-api'
import { roleAccessLabel } from '@/lib/role-access'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fallbackRoles = [
  { id: 'ADMIN', name: 'Admin', description: roleAccessLabel('ADMIN') },
  { id: 'MANAGER', name: 'Manager', description: roleAccessLabel('MANAGER') },
  { id: 'STAFF', name: 'Staff', description: roleAccessLabel('STAFF') },
  { id: 'VIEWER', name: 'Viewer', description: roleAccessLabel('VIEWER') },
  { id: 'APPROVER', name: 'Approver', description: roleAccessLabel('APPROVER') },
]

const departments = [
  { id: 'engineering', name: 'Engineering' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'hr', name: 'Human Resources' },
  { id: 'finance', name: 'Finance' },
  { id: 'operations', name: 'Operations' },
]

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [temporaryAccess, setTemporaryAccess] = useState(false)
  const [roles, setRoles] = useState(fallbackRoles)

  const [formData, setFormData] = useState({
    email: '',
    role: '',
    department: '',
    expiryDate: '',
  })

  useEffect(() => {
    if (!open) return
    let mounted = true
    ;(async () => {
      try {
        const list = await listRoles()
        if (!mounted) return
        const fromApi = list
          .filter((r) => r.code.toUpperCase() !== 'TENANT_OWNER')
          .map((r) => ({
            id: r.code,
            name: r.name,
            description: roleAccessLabel(r.code),
          }))
        const codes = new Set(fromApi.map((r) => r.id.toUpperCase()))
        const merged = [
          ...fromApi,
          ...fallbackRoles.filter((r) => !codes.has(r.id.toUpperCase())),
        ]
        setRoles(merged)
      } catch {
        if (mounted) setRoles(fallbackRoles)
      }
    })()
    return () => {
      mounted = false
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.role) {
      toast({ title: 'Select a role', variant: 'destructive' })
      return
    }
    setIsLoading(true)

    try {
      await inviteTeamMemberByEmail({
        email: formData.email,
        role: formData.role,
        department: formData.department || undefined,
        expiryDate: temporaryAccess && formData.expiryDate ? formData.expiryDate : undefined,
      })
      toast({ title: 'Invite sent', description: `An invitation was emailed to ${formData.email}.` })
      onOpenChange(false)
      setFormData({ email: '', role: '', department: '', expiryDate: '' })
      setTemporaryAccess(false)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast({
        title: 'Invite failed',
        description: err?.response?.data?.message || err?.message || 'Could not send the invite email',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your workspace
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              required
            >
              <SelectTrigger className="w-full" id="invite-role">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div>
                      <p className="font-medium">{role.name}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-department">Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger className="w-full" id="invite-department">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a department (optional)" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">Temporary Access</p>
                <p className="text-xs text-muted-foreground">Set an expiration date for this invite</p>
              </div>
              <Switch
                checked={temporaryAccess}
                onCheckedChange={setTemporaryAccess}
              />
            </div>

            {temporaryAccess && (
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Access Expires On</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="expiry-date"
                    type="date"
                    className="pl-10"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading-spinner mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
