'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other'

export function previewKind(mime: string): PreviewKind {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('text/') || mime === 'application/json') return 'text'
  return 'other'
}

type FilePreviewProps = {
  srcUrl: string
  mimeType: string
  fileName: string
  /** When false, hide download affordances (still cannot fully prevent saving). */
  allowDownload?: boolean
}

/** Renders files in-app (canvas/PDF.js) so the browser's native PDF/image chrome is not used. */
export function FilePreview({ srcUrl, mimeType, fileName, allowDownload = false }: FilePreviewProps) {
  const kind = previewKind(mimeType)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfPages, setPdfPages] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDocRef = useRef<{ numPages: number; getPage: (n: number) => Promise<unknown> } | null>(null)

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false
    setLoading(true)
    setError(null)
    setTextContent(null)
    setBlobUrl(null)
    setPdfPage(1)
    setPdfPages(0)
    pdfDocRef.current = null

    ;(async () => {
      try {
        const res = await fetch(srcUrl, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load file')
        const blob = await res.blob()
        if (cancelled) return

        if (kind === 'text') {
          setTextContent(await blob.text())
        } else if (kind === 'pdf') {
          const data = await blob.arrayBuffer()
          const pdfjs = await import('pdfjs-dist')
          // Use CDN worker so Next/Turbopack does not break the worker path
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
          const doc = await pdfjs.getDocument({ data }).promise
          if (cancelled) return
          pdfDocRef.current = doc as unknown as typeof pdfDocRef.current
          setPdfPages(doc.numPages)
        } else {
          const url = URL.createObjectURL(blob)
          revoked = url
          setBlobUrl(url)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Preview failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [srcUrl, kind])

  useEffect(() => {
    const doc = pdfDocRef.current
    const canvas = canvasRef.current
    if (!doc || !canvas || kind !== 'pdf') return
    let cancelled = false
    ;(async () => {
      try {
        const page = (await doc.getPage(pdfPage)) as {
          getViewport: (o: { scale: number }) => { width: number; height: number }
          render: (o: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => {
            promise: Promise<void>
          }
        }
        const viewport = page.getViewport({ scale: 1.25 * zoom })
        const ctx = canvas.getContext('2d')
        if (!ctx || cancelled) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: ctx, viewport }).promise
      } catch {
        if (!cancelled) setError('Could not render PDF page')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pdfPage, zoom, kind, pdfPages, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading preview…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive p-6 text-center">{error}</p>
  }

  return (
    <div className="space-y-2" onContextMenu={(e) => e.preventDefault()}>
      {(kind === 'image' || kind === 'pdf') && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {kind === 'pdf' && pdfPages > 0 && (
            <div className="flex items-center gap-1 mr-auto text-sm text-muted-foreground">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pdfPage <= 1}
                onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>
                {pdfPage} / {pdfPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pdfPage >= pdfPages}
                onClick={() => setPdfPage((p) => Math.min(pdfPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setZoom(1)}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-secondary/20 overflow-auto min-h-[320px] max-h-[70vh] flex items-start justify-center p-2">
        {kind === 'image' && blobUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt={fileName}
            draggable={false}
            className="max-w-none object-contain select-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          />
        )}
        {kind === 'pdf' && <canvas ref={canvasRef} className="max-w-full" />}
        {kind === 'video' && blobUrl && (
          <video
            src={blobUrl}
            controls
            controlsList={allowDownload ? undefined : 'nodownload noplaybackrate'}
            disablePictureInPicture
            className="max-h-[65vh] w-full"
          />
        )}
        {kind === 'audio' && blobUrl && (
          <div className="p-8 w-full">
            <audio src={blobUrl} controls controlsList={allowDownload ? undefined : 'nodownload'} className="w-full" />
          </div>
        )}
        {kind === 'text' && (
          <pre className="w-full max-h-[65vh] overflow-auto p-4 text-sm text-left whitespace-pre-wrap font-mono">
            {textContent}
          </pre>
        )}
        {kind === 'other' && (
          <div className="text-center p-10 space-y-3 self-center">
            <Eye className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Preview is not available for this file type.
              {allowDownload ? ' Use Download to open it on your device.' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

type FilePreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  srcUrl: string | null
  mimeType: string
  fileName: string
  allowDownload?: boolean
  onDownload?: () => void
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  srcUrl,
  mimeType,
  fileName,
  allowDownload = false,
  onDownload,
}: FilePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{fileName}</DialogTitle>
        </DialogHeader>
        {allowDownload && onDownload && (
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={onDownload}>
              Download
            </Button>
          </div>
        )}
        {open && srcUrl ? (
          <FilePreview srcUrl={srcUrl} mimeType={mimeType} fileName={fileName} allowDownload={allowDownload} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
