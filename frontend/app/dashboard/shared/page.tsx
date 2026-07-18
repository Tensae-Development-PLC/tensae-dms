'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Share2,
  Link2,
  Copy,
  ExternalLink,
  Clock,
  Shield,
  Eye,
  Loader2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listSharedLinks } from '@/lib/client-api'

import { buildShareUrl } from '@/lib/public-url'

type SharedLinkRow = {
  id: string
  token: string
  expiresAt: string | null
  allowDownload: boolean
  createdAt: string
  document: {
    id: string
    name: string
    mimeType: string
    createdAt: string
  }
}

export default function SharedFilesPage() {
  const [items, setItems] = useState<SharedLinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const rows = await listSharedLinks()
        if (!mounted) return
        setItems(rows)
      } catch (e) {
        if (!mounted) return
        setErr(e instanceof Error ? e.message : 'Failed to load shared links')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const active = items.filter((x) => !x.expiresAt || new Date(x.expiresAt) > new Date()).length
    const expiringSoon = items.filter((x) => {
      if (!x.expiresAt) return false
      const ms = new Date(x.expiresAt).getTime() - Date.now()
      return ms > 0 && ms <= 7 * 24 * 60 * 60 * 1000
    }).length

    return [
      { label: 'Shared Links', value: items.length, icon: Share2, className: 'text-primary bg-primary/10' },
      { label: 'Active', value: active, icon: Eye, className: 'text-accent bg-accent/10' },
      { label: 'Expiring in 7 Days', value: expiringSoon, icon: Clock, className: 'text-chart-4 bg-chart-4/10' },
    ]
  }, [items])

  async function copyLink(token: string) {
    const url = buildShareUrl(token)
    await navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Shared Files</h1>
        <p className="text-muted-foreground">Links generated from real shared document records</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.className}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shared Links</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading shared links...
            </div>
          )}

          {err && <p className="text-sm text-destructive">{err}</p>}

          {!loading && !err && items.length === 0 && (
            <p className="text-sm text-muted-foreground">No shared links yet.</p>
          )}

          {!loading && !err && items.length > 0 && (
            <div className="space-y-4">
              {items.map((item, index) => {
                const shareUrl = buildShareUrl(item.token)
                const expired = !!item.expiresAt && new Date(item.expiresAt) <= new Date()

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`p-4 rounded-xl border ${expired ? 'border-border/60 bg-secondary/30' : 'border-border bg-card'}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{item.document.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Link2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">{shareUrl}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Created {new Date(item.createdAt).toLocaleString()}</span>
                            {item.expiresAt ? (
                              <span className="text-xs text-muted-foreground">Expires {new Date(item.expiresAt).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No expiry</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={item.allowDownload ? 'default' : 'secondary'}>
                          <Shield className="w-3 h-3 mr-1" />
                          {item.allowDownload ? 'download' : 'view only'}
                        </Badge>

                        <Badge variant={expired ? 'destructive' : 'secondary'}>{expired ? 'expired' : 'active'}</Badge>

                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void copyLink(item.token)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={shareUrl} target="_blank" rel="noreferrer noopener" aria-label="Open share link">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
