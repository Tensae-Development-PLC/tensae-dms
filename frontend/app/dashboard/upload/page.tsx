'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Cloud,
  Image,
  FileSpreadsheet,
  FileIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { listFolders, uploadDocument } from '@/lib/client-api'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

interface FileUpload {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
  documentId?: string
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return FileSpreadsheet
  if (['pdf'].includes(ext || '')) return FileText
  return FileIcon
}

function UploadPageInner() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [folderId, setFolderId] = useState<string>(searchParams.get('folderId') || '')

  useEffect(() => {
    void (async () => {
      try {
        const list = await listFolders()
        setFolders(list.map((f) => ({ id: f.id, name: f.name })))
      } catch {
        setFolders([])
      }
    })()
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const performUpload = async (fileUpload: FileUpload) => {
    try {
      const result = await uploadDocument(fileUpload.file, {
        folderId: folderId || undefined,
        onProgress: (progress: number) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === fileUpload.id ? { ...u, progress } : u)),
          )
        },
      })

      setUploads((prev) =>
        prev.map((u) =>
          u.id === fileUpload.id
            ? { ...u, progress: 100, status: 'complete', documentId: result.id }
            : u,
        ),
      )

      toast({
        title: 'Success',
        description: `${fileUpload.file.name} uploaded successfully`,
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = err?.response?.data?.message || err?.message || 'Upload failed'
      setUploads((prev) =>
        prev.map((u) =>
          u.id === fileUpload.id ? { ...u, status: 'error', error: errorMsg } : u,
        ),
      )

      toast({
        title: 'Upload Failed',
        description: errorMsg,
        variant: 'destructive',
      })
    }
  }

  const queueFiles = (files: File[]) => {
    const newUploads = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading' as const,
    }))
    setUploads((prev) => [...prev, ...newUploads])
    newUploads.forEach((u) => void performUpload(u))
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      queueFiles(Array.from(e.dataTransfer.files))
    },
    [folderId],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    queueFiles(Array.from(e.target.files || []))
  }

  const removeUpload = (id: string) => {
    const upload = uploads.find((u) => u.id === id)
    if (upload && (upload.status === 'error' || upload.status === 'complete')) {
      setUploads((prev) => prev.filter((u) => u.id !== id))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const hasActiveUploads = uploads.some((u) => u.status === 'uploading')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Upload Documents</h1>
        <p className="text-muted-foreground">Upload files to your workspace (local VPS storage)</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={{
                  scale: isDragging ? 1.02 : 1,
                  borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
                }}
                className={`relative border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={hasActiveUploads}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                      isDragging ? 'bg-primary/20' : 'bg-secondary'
                    }`}
                  >
                    <Cloud className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                  </h3>
                  <p className="text-muted-foreground mb-4">or click to browse from your computer</p>
                  <Button variant="outline" disabled={hasActiveUploads}>
                    <Upload className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported: PDF, DOCX, PNG, JPEG, TXT
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {uploads.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upload progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {uploads.map((upload) => {
                        const FileIconComponent = getFileIcon(upload.file.name)
                        return (
                          <div key={upload.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <FileIconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-foreground truncate">{upload.file.name}</p>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                  {formatFileSize(upload.file.size)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress value={upload.progress} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground w-10">
                                  {Math.round(upload.progress)}%
                                </span>
                              </div>
                              {upload.status === 'error' && upload.error && (
                                <p className="text-xs text-destructive mt-1">{upload.error}</p>
                              )}
                            </div>
                            {upload.status === 'complete' ? (
                              <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                            ) : upload.status === 'error' ? (
                              <button
                                onClick={() => removeUpload(upload.id)}
                                className="p-1 hover:bg-secondary rounded-lg transition-colors"
                                title="Remove failed upload"
                              >
                                <X className="w-4 h-4 text-destructive" />
                              </button>
                            ) : (
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Folder (optional)</Label>
                <Select
                  value={folderId || 'root'}
                  onValueChange={(v) => setFolderId(v === 'root' ? '' : v)}
                  disabled={hasActiveUploads}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Root (no folder)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Root (no folder)</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Create folders from the Documents page. New uploads go into the selected folder.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground p-6">Loading…</p>}>
      <UploadPageInner />
    </Suspense>
  )
}
