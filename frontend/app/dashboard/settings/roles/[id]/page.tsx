'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getRoleById, createRole, updateRole } from '@/lib/client-api'

export default function RoleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const isNew = resolvedParams.id === 'new'

  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [isSystemRole, setIsSystemRole] = useState(false)

  useEffect(() => {
    if (!isNew) {
      void loadRole()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadRole = async () => {
    try {
      setIsLoading(true)
      const role = await getRoleById(resolvedParams.id)
      setRoleName(role.name)
      setIsSystemRole(role.isSystem)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to load role',
        variant: 'destructive',
      })
      router.push('/dashboard/settings/roles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast({ title: 'Error', description: 'Role name is required', variant: 'destructive' })
      return
    }

    try {
      setIsSaving(true)
      if (isNew) {
        await createRole({ name: roleName.trim(), permissions: [] })
        toast({ title: 'Success', description: 'Role created successfully' })
      } else {
        await updateRole(resolvedParams.id, { name: roleName.trim() })
        toast({ title: 'Success', description: 'Role updated successfully' })
      }
      router.push('/dashboard/settings/roles')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to save role',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/settings/roles">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isLoading ? 'Loading...' : isNew ? 'Create Role' : `Edit Role: ${roleName}`}
            </h1>
            <p className="text-muted-foreground">
              V1 uses role codes for access (TENANT_OWNER / ADMIN / MANAGER / STAFF can write documents).
            </p>
          </div>
        </div>
        <Button
          className="glow-primary"
          onClick={() => void handleSave()}
          disabled={isSaving || isLoading || !roleName.trim() || isSystemRole}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Role
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading role...</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Role Information
              </CardTitle>
              <CardDescription>Name-based roles for your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Staff"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={isSystemRole || isSaving}
                />
                {isSystemRole && (
                  <p className="text-xs text-muted-foreground">System roles cannot be edited</p>
                )}
              </div>
              {isSystemRole && <Badge variant="secondary">System Role</Badge>}
              <p className="text-sm text-muted-foreground">
                Tip: name roles <strong>Admin</strong>, <strong>Manager</strong>, or <strong>Staff</strong> so
                document upload/share permissions apply automatically in V1.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
