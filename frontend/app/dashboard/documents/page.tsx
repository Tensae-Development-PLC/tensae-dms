'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Folder,
  Grid3X3,
  List,
  Search,
  Filter,
  SortAsc,
  Plus,
  MoreHorizontal,
  Eye,
  Download,
  Star,
  Share2,
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
import Link from 'next/link'
import { getSignedDownloadUrl, listDocuments, listFolders, shareDocument, toggleFavorite } from '@/lib/client-api'
import { formatBytes } from '@/lib/format'

type ApiDoc = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string | bigint
  createdAt: string
  scanStatus?: string
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<ApiDoc[]>([])
  const [folders, setFolders] = useState<ApiFolder[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [docs, fds] = await Promise.all([listDocuments() as Promise<ApiDoc[]>, listFolders()])
      setItems(docs)
      setFolders(fds)
    } catch {
      setItems([])
      setFolders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredDocuments = items.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  async function onDownload(docId: string) {
    try {
      const { url } = await getSignedDownloadUrl(docId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      /* handled by api interceptor */
    }
  }

  async function onFavorite(docId: string) {
    try {
      await toggleFavorite(docId)
      await refresh()
    } catch {
      /* noop */
    }
  }

  async function onShare(docId: string) {
    try {
      await shareDocument({ documentId: docId, allowDownload: true })
      await refresh()
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">Manage and organize your files</p>
        </div>
        <Button className="glow-primary" asChild>
          <Link href="/dashboard/upload">
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Folders</h2>
        {folders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No folders yet. Create one via the API or upload flow.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {folders.map((folder, index) => {
              const ac = folderAccent[index % folderAccent.length]
              return (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="cursor-pointer hover:border-primary/30 transition-colors group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          <Folder className={`w-5 h-5 ${ac}`} />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
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

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground">All documents</h2>

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
            <Button variant="outline" size="sm" type="button">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" type="button">
              <SortAsc className="w-4 h-4 mr-2" />
              Sort
            </Button>
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
        ) : viewMode === 'list' ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden md:table-cell">
                        Size
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden lg:table-cell">
                        Owner
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4 hidden sm:table-cell">
                        Date
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-4">Scan</th>
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
                          <span className="text-sm text-muted-foreground">
                            {formatBytes(doc.sizeBytes)}
                          </span>
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
                        <td className="p-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground">
                            {doc.scanStatus || '—'}
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
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/documents?focus=${doc.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Focus
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void onDownload(doc.id)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void onShare(doc.id)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Create share link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void onFavorite(doc.id)}>
                                <Star className="w-4 h-4 mr-2" />
                                Toggle favorite
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
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
                <Card className="cursor-pointer hover:border-primary/30 transition-colors group">
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
                          <DropdownMenuItem onClick={() => void onDownload(doc.id)}>Download</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void onShare(doc.id)}>Share</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void onFavorite(doc.id)}>Favorite</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="font-medium text-foreground truncate mb-1">{doc.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.sizeBytes)}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {doc.scanStatus || '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
