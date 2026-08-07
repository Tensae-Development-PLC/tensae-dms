'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Folder,
  Grid3X3,
  List,
  Search,
  Plus,
  MoreHorizontal,
  Download,
  Star,
  Share2,
  Trash2,
  FolderPlus,
  Pencil,
  Eye,
  Archive,
  ArchiveRestore,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  createFolder,
  deleteDocument,
  deleteFolder,
  archiveDocument,
  restoreDocument,
  getProfile,
  getSignedDownloadUrl,
  listDocuments,
  listFolders,
  renameDocument,
  renameFolder,
  shareDocument,
  addFavorite,
} from '@/lib/client-api'
import { formatBytes } from '@/lib/format'
import { canDownloadDocuments } from '@/lib/role-access'
import { useToast } from '@/hooks/use-toast'
import { FilePreviewDialog } from '@/components/documents/file-preview'

type ApiDoc = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string | bigint
  createdAt: string
  scanStatus?: string
  folderId?: string | null
  owner?: { fullName?: string; email?: string }
}

type ApiFolder = { id: string; name: string; _count: { documents: number } }

const folderAccent = ['text-primary', 'text-accent', 'text-chart-3', 'text-chart-4'] as const

function mimeLabel(mime: string) {
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('word')) return 'DOCX'
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLSX'
  if (mime.includes('image')) return 'Image'
  return mime.split('/').pop()?.toUpperCase() ?? 'File'
}

export default function DocumentsPage() {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<ApiDoc[]>([])
  const [folders, setFolders] = useState<ApiFolder[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareDocId, setShareDocId] = useState<string | null>(null)
  const [shareAllowDownload, setShareAllowDownload] = useState(true)
  const [shareExpiryDays, setShareExpiryDays] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ type: 'doc' | 'folder'; id: string; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [canDownload, setCanDownload] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<{
    url: string
    name: string
    mimeType: string
    id: string
  } | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const profile = await getProfile()
        setCanDownload(canDownloadDocuments(profile.roleCode))
      } catch {
        setCanDownload(true)
      }
    })()
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [docs, fds] = await Promise.all([
        listDocuments({
          folderId: searchQuery.trim() ? undefined : activeFolderId ?? undefined,
          q: searchQuery.trim() || undefined,
          archived: showArchived,
        }) as Promise<ApiDoc[]>,
        listFolders(),
      ])
      setItems(docs)
      setFolders(fds)
    } catch {
      setItems([])
      setFolders([])
    } finally {
      setLoading(false)
    }
  }, [activeFolderId, searchQuery, showArchived])

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh()
    }, searchQuery.trim() ? 300 : 0)
    return () => clearTimeout(t)
  }, [refresh, searchQuery])

  const filteredDocuments = items

  async function onDownload(docId: string) {
    try {
      const { url } = await getSignedDownloadUrl(docId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      /* handled by api interceptor */
    }
  }

  async function onPreview(doc: ApiDoc) {
    try {
      const { url } = await getSignedDownloadUrl(doc.id, true)
      setPreview({ url, name: doc.name, mimeType: doc.mimeType, id: doc.id })
      setPreviewOpen(true)
    } catch {
      toast({ title: 'Preview failed', variant: 'destructive' })
    }
  }

  async function onFavorite(docId: string) {
    try {
      await addFavorite(docId)
      toast({ title: 'Added to favorites' })
    } catch {
      /* noop */
    }
  }

  function openShare(docId: string) {
    setShareDocId(docId)
    setShareAllowDownload(true)
    setShareExpiryDays('')
    setShareOpen(true)
  }

  async function onShareConfirm() {
    if (!shareDocId) return
    try {
      let expiresAt: string | undefined
      if (shareExpiryDays.trim()) {
        const days = Number(shareExpiryDays)
        if (Number.isFinite(days) && days > 0) {
          expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        }
      }
      await shareDocument({
        documentId: shareDocId,
        allowDownload: shareAllowDownload,
        expiresAt,
      })
      setShareOpen(false)
      toast({
        title: 'Share link created',
        description: shareAllowDownload
          ? 'Recipients can preview and download. Copy the link from Shared Files.'
          : 'Recipients can preview only — download is disabled.',
      })
    } catch {
      toast({ title: 'Share failed', variant: 'destructive' })
    }
  }

  async function onArchive(docId: string, name: string) {
    if (!confirm(`Archive "${name}"? You can restore it from the archive view.`)) return
    try {
      await archiveDocument(docId)
      toast({ title: 'Archived', description: `${name} was moved to archive.` })
      await refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to archive'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  async function onRestore(docId: string, name: string) {
    try {
      await restoreDocument(docId)
      toast({ title: 'Restored', description: `${name} is back in your documents.` })
      await refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to restore'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  async function onDelete(docId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteDocument(docId)
      toast({ title: 'Deleted', description: `${name} was removed.` })
      await refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  function openRename(type: 'doc' | 'folder', id: string, name: string) {
    setRenameTarget({ type, id, name })
    setRenameValue(name)
    setRenameOpen(true)
  }

  async function onRenameConfirm() {
    if (!renameTarget || !renameValue.trim()) return
    try {
      if (renameTarget.type === 'doc') {
        await renameDocument(renameTarget.id, renameValue.trim())
      } else {
        await renameFolder(renameTarget.id, renameValue.trim())
      }
      setRenameOpen(false)
      toast({ title: 'Renamed' })
      await refresh()
    } catch (e: unknown) {
      toast({
        title: 'Rename failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      })
    }
  }

  async function onDeleteFolder(folderId: string, name: string) {
    if (!confirm(`Delete folder "${name}"? It must be empty.`)) return
    try {
      await deleteFolder(folderId)
      if (activeFolderId === folderId) setActiveFolderId(null)
      toast({ title: 'Folder deleted' })
      await refresh()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      toast({
        title: 'Could not delete folder',
        description: err?.response?.data?.message || err?.message || 'Folder must be empty',
        variant: 'destructive',
      })
    }
  }

  async function onCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return
    setCreatingFolder(true)
    try {
      await createFolder({ name })
      setNewFolderOpen(false)
      setNewFolderName('')
      toast({ title: 'Folder created' })
      await refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create folder'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setCreatingFolder(false)
    }
  }

  const activeFolder = folders.find((f) => f.id === activeFolderId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            {showArchived
              ? 'Archived documents — restore or delete permanently'
              : activeFolder
                ? `Folder: ${activeFolder.name}`
                : 'Manage and organize your files'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showArchived ? 'secondary' : 'outline'}
            onClick={() => {
              setShowArchived((v) => !v)
              setActiveFolderId(null)
            }}
          >
            <Archive className="w-4 h-4 mr-2" />
            {showArchived ? 'Show active' : 'Archive'}
          </Button>
          {!showArchived && (
            <>
              <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              <Button className="glow-primary" asChild>
                <Link href={activeFolderId ? `/dashboard/upload?folderId=${activeFolderId}` : '/dashboard/upload'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {!showArchived && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Folders</h2>
            {activeFolderId && (
              <Button variant="ghost" size="sm" onClick={() => setActiveFolderId(null)}>
                Show all documents
              </Button>
            )}
          </div>
          {folders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No folders yet. Create one to organize uploads.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {folders.map((folder, index) => {
              const ac = folderAccent[index % folderAccent.length]
              const selected = activeFolderId === folder.id
              return (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer hover:border-primary/30 transition-colors group ${selected ? 'border-primary' : ''}`}
                    onClick={() => setActiveFolderId(folder.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center`}>
                          <Folder className={`w-5 h-5 ${ac}`} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => openRename('folder', folder.id, folder.name)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => void onDeleteFolder(folder.id, folder.name)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3">
                        <p className="font-medium text-foreground">{folder.name}</p>
                        <p className="text-sm text-muted-foreground">{folder._count.documents} files</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {showArchived ? 'Archived documents' : activeFolder ? `Documents in ${activeFolder.name}` : 'All documents'}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center border border-border rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : filteredDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents in this view.</p>
        ) : viewMode === 'list' ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">Size</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden lg:table-cell">Owner</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">Date</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc, index) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[200px] lg:max-w-[300px]">
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{mimeLabel(doc.mimeType)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{formatBytes(doc.sizeBytes)}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {doc.owner?.fullName || doc.owner?.email || '—'}
                          </span>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void onPreview(doc)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              {canDownload && (
                                <DropdownMenuItem onClick={() => void onDownload(doc.id)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              {!showArchived && (
                                <>
                                  <DropdownMenuItem onClick={() => openShare(doc.id)}>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Create share link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openRename('doc', doc.id, doc.name)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => void onFavorite(doc.id)}>
                                    <Star className="w-4 h-4 mr-2" />
                                    Add to favorites
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => void onArchive(doc.id, doc.name)}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                </>
                              )}
                              {showArchived && (
                                <>
                                  <DropdownMenuItem onClick={() => void onRestore(doc.id, doc.name)}>
                                    <ArchiveRestore className="w-4 h-4 mr-2" />
                                    Restore
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => void onDelete(doc.id, doc.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {showArchived ? 'Delete permanently' : 'Delete'}
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="hover:border-primary/30 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => void onPreview(doc)}>Preview</DropdownMenuItem>
                          {canDownload && (
                            <DropdownMenuItem onClick={() => void onDownload(doc.id)}>Download</DropdownMenuItem>
                          )}
                          {!showArchived && (
                            <>
                              <DropdownMenuItem onClick={() => openShare(doc.id)}>Share</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRename('doc', doc.id, doc.name)}>Rename</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void onFavorite(doc.id)}>Favorite</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void onArchive(doc.id, doc.name)}>Archive</DropdownMenuItem>
                            </>
                          )}
                          {showArchived && (
                            <DropdownMenuItem onClick={() => void onRestore(doc.id, doc.name)}>Restore</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => void onDelete(doc.id, doc.name)}
                          >
                            {showArchived ? 'Delete permanently' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="font-medium text-foreground truncate mb-1">{doc.name}</p>
                    <span className="text-xs text-muted-foreground">{formatBytes(doc.sizeBytes)}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="folderName">Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Contracts"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onCreateFolder()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onCreateFolder()} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create share link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shareAllowDownload}
                onChange={(e) => setShareAllowDownload(e.target.checked)}
              />
              Allow download (if off, recipients can still preview in our viewer)
            </label>
            <div className="space-y-2">
              <Label htmlFor="shareExpiry">Expires in (days, optional)</Label>
              <Input
                id="shareExpiry"
                type="number"
                min={1}
                placeholder="e.g. 7"
                value={shareExpiryDays}
                onChange={(e) => setShareExpiryDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onShareConfirm()}>Create link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type === 'folder' ? 'folder' : 'document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="renameValue">Name</Label>
            <Input
              id="renameValue"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onRenameConfirm()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onRenameConfirm()} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) setPreview(null)
        }}
        srcUrl={preview?.url ?? null}
        mimeType={preview?.mimeType ?? ''}
        fileName={preview?.name ?? ''}
        allowDownload={canDownload}
        onDownload={preview ? () => void onDownload(preview.id) : undefined}
      />
    </div>
  )
}
