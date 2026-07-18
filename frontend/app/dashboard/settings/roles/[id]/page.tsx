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
                    disabled={initialData.isDefault}
                  />
                  {initialData.isDefault && (
                    <p className="text-xs text-muted-foreground">Default roles cannot be renamed</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    placeholder="Describe what this role can do..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                {initialData.isDefault && (
                  <Badge variant="secondary">Default Role</Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Advanced Permissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Advanced Permissions</CardTitle>
                <CardDescription>Additional access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Allow Download</p>
                      <p className="text-xs text-muted-foreground">Can download documents</p>
                    </div>
                  </div>
                  <Switch
                    checked={advancedPermissions.allowDownload}
                    onCheckedChange={(checked) => 
                      setAdvancedPermissions({ ...advancedPermissions, allowDownload: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">External Sharing</p>
                      <p className="text-xs text-muted-foreground">Share outside workspace</p>
                    </div>
                  </div>
                  <Switch
                    checked={advancedPermissions.allowExternalSharing}
                    onCheckedChange={(checked) => 
                      setAdvancedPermissions({ ...advancedPermissions, allowExternalSharing: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Restrict by Department</p>
                        <p className="text-xs text-muted-foreground">Limit to specific departments</p>
                      </div>
                    </div>
                    <Switch
                      checked={advancedPermissions.restrictByDepartment}
                      onCheckedChange={(checked) => 
                        setAdvancedPermissions({ ...advancedPermissions, restrictByDepartment: checked })
                      }
                    />
                  </div>
                  
                  {advancedPermissions.restrictByDepartment && (
                    <div className="pl-7 space-y-2">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={advancedPermissions.selectedDepartments.includes(dept.id)}
                            onCheckedChange={(checked) => {
                              setAdvancedPermissions(prev => ({
                                ...prev,
                                selectedDepartments: checked
                                  ? [...prev.selectedDepartments, dept.id]
                                  : prev.selectedDepartments.filter(d => d !== dept.id)
                              }))
                            }}
                          />
                          <Label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer">
                            {dept.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Restrict by Document Type</p>
                        <p className="text-xs text-muted-foreground">Limit to specific doc types</p>
                      </div>
                    </div>
                    <Switch
                      checked={advancedPermissions.restrictByDocType}
                      onCheckedChange={(checked) => 
                        setAdvancedPermissions({ ...advancedPermissions, restrictByDocType: checked })
                      }
                    />
                  </div>
                  
                  {advancedPermissions.restrictByDocType && (
                    <div className="pl-7 space-y-2">
                      {documentTypes.map((docType) => (
                        <div key={docType.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`doctype-${docType.id}`}
                            checked={advancedPermissions.selectedDocTypes.includes(docType.id)}
                            onCheckedChange={(checked) => {
                              setAdvancedPermissions(prev => ({
                                ...prev,
                                selectedDocTypes: checked
                                  ? [...prev.selectedDocTypes, docType.id]
                                  : prev.selectedDocTypes.filter(d => d !== docType.id)
                              }))
                            }}
                          />
                          <Label htmlFor={`doctype-${docType.id}`} className="text-sm cursor-pointer">
                            {docType.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Permission Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>Configure what this role can access and modify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Feature</th>
                      <th className="p-4 text-center font-medium text-muted-foreground w-20">View</th>
                      <th className="p-4 text-center font-medium text-muted-foreground w-20">Create</th>
                      <th className="p-4 text-center font-medium text-muted-foreground w-20">Edit</th>
                      <th className="p-4 text-center font-medium text-muted-foreground w-20">Delete</th>
                      <th className="p-4 text-center font-medium text-muted-foreground w-20">Approve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature) => {
                      const Icon = feature.icon
                      const featurePermissions = permissions[feature.id] || []
                      const allSelected = featurePermissions.length === feature.permissions.length
                      
                      return (
                        <tr key={feature.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <button
                              onClick={() => toggleAllForFeature(feature.id, feature)}
                              className="flex items-center gap-3 hover:text-primary transition-colors"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                allSelected ? 'bg-primary/20' : 'bg-muted'
                              }`}>
                                <Icon className={`w-4 h-4 ${allSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <span className="font-medium">{feature.name}</span>
                            </button>
                          </td>
                          {(['view', 'create', 'edit', 'delete', 'approve'] as Permission[]).map((perm) => (
                            <td key={perm} className="p-4 text-center">
                              {feature.permissions.includes(perm) ? (
                                <Checkbox
                                  checked={featurePermissions.includes(perm)}
                                  onCheckedChange={() => togglePermission(feature.id, perm)}
                                  className="mx-auto"
                                />
                              ) : (
                                <span className="text-muted-foreground/30">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> Click on a feature name to toggle all permissions for that feature at once.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
