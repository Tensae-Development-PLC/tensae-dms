'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Clock,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listDocuments, listNotifications } from '@/lib/client-api'

type NotificationItem = {
  id: string
  title: string
  body: string
  readAt?: string | null
  createdAt: string
}

type ApiDocument = {
  id: string
  name: string
  scanStatus?: string
  createdAt: string
}

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [documents, setDocuments] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const [notes, docs] = await Promise.all([
          listNotifications() as Promise<NotificationItem[]>,
          listDocuments() as Promise<ApiDocument[]>,
        ])
        if (!mounted) return
        setNotifications(notes)
        setDocuments(docs)
      } catch (e) {
        if (!mounted) return
        setErr(e instanceof Error ? e.message : 'Failed to load alerts')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const scanAlerts = useMemo(
    () => documents.filter((d) => ['FAILED', 'PENDING'].includes((d.scanStatus || '').toUpperCase())),
    [documents],
  )

  const stats = [
    { label: 'Total Alerts', value: notifications.length + scanAlerts.length, icon: Bell, className: 'text-primary bg-primary/10' },
    { label: 'Unread Notifications', value: notifications.filter((n) => !n.readAt).length, icon: AlertTriangle, className: 'text-destructive bg-destructive/10' },
    { label: 'Scan Alerts', value: scanAlerts.length, icon: Clock, className: 'text-chart-4 bg-chart-4/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Expiry & Alerts</h1>
        <p className="text-muted-foreground">Notifications and document health alerts from live tenant data</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading notifications...
              </div>
            )}
            {err && <p className="text-sm text-destructive">{err}</p>}
            {!loading && !err && notifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No notifications.</p>
            )}
            {!loading && !err && notifications.length > 0 && (
              <div className="space-y-3">
                {notifications.map((n, index) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <Badge variant={n.readAt ? 'secondary' : 'default'}>{n.readAt ? 'read' : 'new'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !err && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading document alerts...
              </div>
            )}
            {!loading && !err && scanAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground">No document scan alerts.</p>
            )}
            {!loading && !err && scanAlerts.length > 0 && (
              <div className="space-y-3">
                {scanAlerts.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <p className="font-medium text-foreground truncate">{doc.name}</p>
                      </div>
                      <Badge variant={(doc.scanStatus || '').toUpperCase() === 'FAILED' ? 'destructive' : 'secondary'}>
                        {(doc.scanStatus || 'PENDING').toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Created {new Date(doc.createdAt).toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
