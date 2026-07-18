'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { Download, Eye, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resolveSharedLink } from '@/lib/client-api'
import { formatBytes } from '@/lib/format'

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
}

function previewKind(mime: string): 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other' {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('text/') || mime === 'application/json') return 'text'
  return 'other'
}

function SharePageInner() {
  const params = useParams()
  const token = String(params.token ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<Awaited<ReturnType<typeof resolveSharedLink>> | null>(null)
  const [textPreview, setTextPreview] = useState<string | null>(null)

  const viewUrl = useMemo(
    () => (token ? `${apiBase()}/client/shared/${encodeURIComponent(token)}/view` : ''),
    [token],
  )
  const downloadUrl = useMemo(
    () => (token ? `${apiBase()}/client/shared/${encodeURIComponent(token)}/download` : ''),
    [token],
  )

  useEffect(() => {
    if (!token) {
      setError('Invalid share link')
      setLoading(false)
      return
    }
    void (async () => {
      try {
        const resolved = await resolveSharedLink(token)
        setLink(resolved)
        if (previewKind(resolved.document.mimeType) === 'text') {
          try {
            const res = await fetch(`${apiBase()}/client/shared/${encodeURIComponent(token)}/view`)
            if (res.ok) setTextPreview(await res.text())
          } catch {
            /* preview optional */
          }
        }
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string }
        setError(err?.response?.data?.message || err?.message || 'Link not found or expired')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Unable to open this link'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kind = previewKind(link.document.mimeType)

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="mx-auto max-w-5xl space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {link.document.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {link.document.mimeType} · {formatBytes(link.document.sizeBytes)}
                {link.expiresAt ? ` · Expires ${new Date(link.expiresAt).toLocaleString()}` : ''}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {link.allowDownload ? (
                <Button asChild>
                  <a href={downloadUrl} download={link.document.name}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground self-center">Download disabled — view only</p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-secondary/20 overflow-hidden min-h-[320px] flex items-center justify-center">
              {kind === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewUrl}
                  alt={link.document.name}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              )}
              {kind === 'pdf' && (
                <iframe
                  title={link.document.name}
                  src={viewUrl}
                  className="w-full h-[70vh] bg-background"
                />
              )}
              {kind === 'video' && (
                <video src={viewUrl} controls className="max-h-[70vh] w-full" />
              )}
              {kind === 'audio' && (
                <div className="p-8 w-full">
                  <audio src={viewUrl} controls className="w-full" />
                </div>
              )}
              {kind === 'text' && (
                <pre className="w-full max-h-[70vh] overflow-auto p-4 text-sm text-left whitespace-pre-wrap font-mono">
                  {textPreview ?? 'Loading preview…'}
                </pre>
              )}
              {kind === 'other' && (
                <div className="text-center p-10 space-y-3">
                  <Eye className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    In-browser preview is not available for this file type.
                    {link.allowDownload ? ' Use Download to open it on your device.' : ''}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SharePageInner />
    </Suspense>
  )
}
