'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle,
  HardDrive,
  Upload,
  Scan,
  TrendingUp,
  Eye,
  Download,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  getTenantReport,
  listDocuments,
  listNotifications,
} from '@/lib/client-api'
import { formatMegabytes } from '@/lib/format'

type DocRow = {
  id: string
  name: string
  mimeType: string
  createdAt: string
  owner?: { fullName?: string; email?: string }
  scanStatus?: string
}

type NotifRow = { id: string; title: string; body: string; createdAt: string }

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  colorClass,
  index,
}: {
  title: string
  value: string
  sub?: string
  icon: typeof FileText
  colorClass: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="relative overflow-hidden hover:border-primary/30 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
              {sub ? (
                <p className="text-xs text-muted-foreground mt-2">{sub}</p>
              ) : null}
            </div>
            <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [report, setReport] = useState<Awaited<ReturnType<typeof getTenantReport>> | null>(null)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [notifications, setNotifications] = useState<NotifRow[]>([])

  useEffect(() => {
    let m = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const [r, d, n] = await Promise.all([
          getTenantReport(),
          listDocuments() as Promise<DocRow[]>,
          listNotifications() as Promise<NotifRow[]>,
        ])
        if (!m) return
        setReport(r)
        setDocs(d.slice(0, 8))
        setNotifications(n.slice(0, 8))
      } catch (e) {
        if (!m) return
        setErr(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        if (m) setLoading(false)
      }
    })()
    return () => {
      m = false
    }
  }, [])

  const quota = report?.quota
  const usedPct =
    quota && quota.storageLimitMb > 0
      ? Math.min(100, Math.round((quota.storageUsedMb / quota.storageLimitMb) * 100))
      : null

  const stats = report
    ? [
        {
          title: 'Total documents',
          value: String(report.totals.documents),
          sub: `${report.totals.favorites} favorited`,
          icon: FileText,
          colorClass: 'bg-primary/10 text-primary',
        },
        {
          title: 'Workflows',
          value: String(report.totals.workflows),
          sub: 'Defined in workspace',
          icon: Clock,
          colorClass: 'bg-chart-5/10 text-chart-5',
        },
        {
          title: 'Notifications',
          value: String(report.totals.notifications),
          sub: 'In your inbox',
          icon: CheckCircle,
          colorClass: 'bg-accent/10 text-accent',
        },
        {
          title: 'Storage used',
          value: quota ? formatMegabytes(quota.storageUsedMb) : '—',
          sub:
            quota && usedPct !== null
              ? `${usedPct}% of ${formatMegabytes(quota.storageLimitMb)}`
              : undefined,
          icon: HardDrive,
          colorClass: 'bg-chart-3/10 text-chart-3',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Document overview for your workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/upload">
              <Scan className="w-4 h-4 mr-2" />
              Upload
            </Link>
          </Button>
          <Button size="sm" className="glow-primary" asChild>
            <Link href="/dashboard/upload">
              <Upload className="w-4 h-4 mr-2" />
              New upload
            </Link>
          </Button>
        </div>
      </div>

      {err ? (
        <p className="text-sm text-destructive">{err}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.title} {...stat} index={index} />
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Recent documents</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/documents">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {docs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No documents yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3">Name</th>
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3 hidden sm:table-cell">
                              Owner
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3 hidden md:table-cell">
                              Added
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3">Scan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docs.map((doc) => (
                            <tr
                              key={doc.id}
                              className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                            >
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate max-w-[220px]">
                                      {doc.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{doc.mimeType}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 hidden sm:table-cell">
                                <span className="text-sm text-muted-foreground">
                                  {doc.owner?.fullName || doc.owner?.email || '—'}
                                </span>
                              </td>
                              <td className="py-3 hidden md:table-cell">
                                <span className="text-sm text-muted-foreground">
                                  {new Date(doc.createdAt).toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-xs font-medium uppercase text-muted-foreground">
                                  {doc.scanStatus || '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/alerts">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6">No notifications.</p>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-primary" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.body}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}
