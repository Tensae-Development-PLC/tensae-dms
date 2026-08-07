'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  FileText,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listFavorites, removeFavorite } from '@/lib/client-api'
import { formatBytes } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

type FavoriteRow = {
  id: string
  createdAt: string
  document: {
    id: string
    name: string
    mimeType: string
    sizeBytes: string | bigint
    createdAt: string
  }
}

function mimeLabel(mime: string) {
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('word')) return 'DOCX'
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLSX'
  if (mime.includes('image')) return 'Image'
  return mime.split('/').pop()?.toUpperCase() ?? 'File'
}

function fileColor(mime: string) {
  if (mime.includes('pdf')) return 'text-destructive'
  if (mime.includes('word')) return 'text-primary'
  if (mime.includes('sheet') || mime.includes('excel')) return 'text-accent'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'text-chart-4'
  return 'text-muted-foreground'
}

export default function FavoritesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<FavoriteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      setItems((await listFavorites()) as FavoriteRow[])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const totalBytes = useMemo(() => {
    return items.reduce((sum, x) => sum + Number(x.document.sizeBytes || 0), 0)
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Favorites</h1>
          <p className="text-muted-foreground">Your starred documents from the database</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Star className="w-5 h-5 text-chart-4 fill-chart-4" />
          <span className="text-sm">{items.length} documents</span>
          <Badge variant="secondary">{formatBytes(totalBytes)}</Badge>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading favorites...
        </div>
      )}

      {err && <p className="text-sm text-destructive">{err}</p>}

      {!loading && !err && items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
          <p className="text-muted-foreground">Star documents from the Documents page to see them here.</p>
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((fav, index) => {
            const doc = fav.document
            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                        <FileText className={`w-7 h-7 ${fileColor(doc.mimeType)}`} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          void (async () => {
                            try {
                              await removeFavorite(doc.id)
                              toast({ title: 'Removed from favorites' })
                              await load()
                            } catch {
                              toast({ title: 'Failed to remove', variant: 'destructive' })
                            }
                          })()
                        }
                      >
                        <Star className="w-4 h-4 text-chart-4 fill-chart-4 mr-1" />
                        Unfavorite
                      </Button>
                    </div>

                    <h3 className="font-medium text-foreground mb-1 truncate">{doc.name}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{mimeLabel(doc.mimeType)} • {formatBytes(doc.sizeBytes)}</span>
                      <span className="text-xs">Added {new Date(fav.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
