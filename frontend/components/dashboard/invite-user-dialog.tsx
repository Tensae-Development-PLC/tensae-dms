'use client'

import { useState } from 'react'
import { Mail, Shield, Building2, Calendar, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { inviteTeamMemberByEmail } from '@/lib/client-api'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roles = [
  { id: 'admin', name: 'Admin', description: 'Full access to all features' },
  { id: 'manager', name: 'Manager', description: 'Manage documents and team' },
  { id: 'staff', name: 'Staff', description: 'Create and edit documents' },
  { id: 'viewer', name: 'Viewer', description: 'View-only access' },
  { id: 'approver', name: 'Approver', description: 'Review and approve documents' },
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
  
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    department: '',
    expiryDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    } catch (error) {
      toast({
        title: 'Invite failed',
        description: error instanceof Error ? error.message : 'Could not send the invite email',
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
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
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
