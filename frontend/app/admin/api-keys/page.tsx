'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Key, 
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { listApiKeys, createApiKey, deleteApiKey } from '@/lib/client-api'

interface ApiKey {
  id: string
  name: string
  keyHash: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  rawKey?: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingKey, setCreatingKey] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExp, setNewKeyExp] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showRawKey, setShowRawKey] = useState<{ id: string; key: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      const keys = await listApiKeys()
      setApiKeys(keys)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load API keys',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a key name',
        variant: 'destructive'
      })
      return
    }

    try {
      setCreatingKey(true)
      const newKey = await createApiKey({
        name: newKeyName.trim(),
        expiresAt: newKeyExp || undefined
      })
      
      // Show raw key in a special way (only once during creation)
      setShowRawKey({ id: newKey.id, key: newKey.rawKey })
      
      setApiKeys([newKey, ...apiKeys])
      setNewKeyName('')
      setNewKeyExp('')
      setDialogOpen(false)
      
      toast({
        title: 'Success',
        description: 'API key created. Save it now as you won\'t be able to see it again.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create API key',
        variant: 'destructive'
      })
    } finally {
      setCreatingKey(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(keyId)
      await deleteApiKey(keyId)
      setApiKeys(apiKeys.filter(k => k.id !== keyId))
      setShowRawKey(null)
      
      toast({
        title: 'Success',
        description: 'API key deleted'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete API key',
        variant: 'destructive'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(keyId)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const maskKey = (hash: string) => {
    // Show first and last few chars of hash
    if (hash.length < 16) return hash
    return hash.substring(0, 8) + '••••••••••••••••' + hash.substring(hash.length - 8)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground">Manage API access and authentication tokens</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for accessing the DMS API.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Key Name</label>
                <Input 
                  placeholder="e.g., Production API Key" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  disabled={creatingKey}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiration Date (Optional)</label>
                <Input 
                  type="date"
                  value={newKeyExp}
                  onChange={(e) => setNewKeyExp(e.target.value)}
                  disabled={creatingKey}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creatingKey}>Cancel</Button>
              <Button 
                className="bg-primary hover:bg-primary/90" 
                onClick={handleCreateKey}
                disabled={creatingKey}
              >
                {creatingKey && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warning Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Keep your API keys secure</p>
              <p className="text-sm text-muted-foreground">
                Never share your API keys or commit them to version control. Use environment variables instead.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Keys List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Key className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground">No API keys yet. Create one to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey, index) => (
            <motion.div
              key={apiKey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{apiKey.name}</h3>
                          <p className="text-xs text-muted-foreground">Created {formatDate(apiKey.createdAt)}</p>
                        </div>
                      </div>

                      {/* API Key Display (masked hash or raw key if just created) */}
                      {showRawKey?.id === apiKey.id ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20 font-mono text-sm">
                          <span className="text-foreground flex-1 break-all">{showRawKey.key}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="shrink-0"
                            onClick={() => {
                              copyToClipboard(showRawKey.key, apiKey.id)
                              toast({ title: 'Copied to clipboard' })
                            }}
                          >
                            {copiedKey === apiKey.id ? (
                              <Check className="w-4 h-4 text-accent" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 font-mono text-sm">
                          <span className="text-muted-foreground flex-1">{maskKey(apiKey.keyHash)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0"
                            disabled
                            title="Key hash is hidden for security"
                          >
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {apiKey.lastUsedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                          </div>
                        )}
                        {apiKey.expiresAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Expires: {formatDate(apiKey.expiresAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteKey(apiKey.id)}
                        disabled={deletingId === apiKey.id}
                      >
                        {deletingId === apiKey.id && <Loader2 className="w-4 h-4 animate-spin" />}
                        {!deletingId && <Trash2 className="w-4 h-4" />}
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">API Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to integrate with the Tensae DMS API
                  </p>
                </div>
              </div>
              <Button variant="outline">View Docs</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
