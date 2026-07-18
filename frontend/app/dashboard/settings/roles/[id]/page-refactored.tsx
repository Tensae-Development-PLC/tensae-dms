'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Shield, 
  ArrowLeft, 
  Save,
  AlertCircle
} from 'lucide-react'
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

  // Load role if editing existing
  useEffect(() => {
    if (!isNew) {
      loadRole()
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
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to load role'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      router.push('/dashboard/settings/roles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast({
        title: 'Error',
        description: 'Role name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      
      if (isNew) {
        await createRole({
          name: roleName.trim(),
          permissions: [],
        })
        toast({
          title: 'Success',
          description: 'Role created successfully',
        })
      } else {
        await updateRole(resolvedParams.id, {
          name: roleName.trim(),
        })
        toast({
          title: 'Success',
          description: 'Role updated successfully',
        })
      }
      
      router.push('/dashboard/settings/roles')
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save role'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
              {isLoading ? '...' : isNew ? 'Define a new role with custom permissions' : 'Modify role permissions and settings'}
            </p>
          </div>
        </div>
        <Button 
          className="glow-primary" 
          onClick={handleSave}
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
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading role...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Role Info */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Role Information
                  </CardTitle>
                  <CardDescription>Basic details about this role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      placeholder="e.g., Project Manager"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      disabled={isSystemRole || isSaving}
                    />
                    {isSystemRole && (
                      <p className="text-xs text-muted-foreground">System roles cannot be edited</p>
                    )}
                  </div>
                  {isSystemRole && (
                    <Badge variant="secondary">System Role</Badge>
                  )}
                  {isNew && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> New roles will have no permissions by default. You can assign permissions by editing the role after creation.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>About This Role</CardTitle>
                <CardDescription>Role management and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Permission Management</p>
                      <p className="text-muted-foreground">
                        Detailed permission configuration is available in the admin panel. This interface allows you to manage basic role information.
                      </p>
                    </div>
                  </div>
                </div>

                {!isNew && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium text-foreground">Quick Actions</h4>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/settings">
                        Go to Admin Panel
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
