'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Upload, 
  Eye, 
  Edit3, 
  Download,
  Trash2,
  Share2,
  Filter,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { recentActivity } from '@/lib/client-api'

type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  actorName?: string | null;
  actorEmail?: string | null;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const entries = await recentActivity(100)
        if (!mounted) return
        setLogs(entries)
      } catch (e) {
        if (!mounted) return
        setErr(e instanceof Error ? e.message : 'Failed to load activity logs')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'upload': return Upload
      case 'view': return Eye
      case 'edit': return Edit3
      case 'download': return Download
      case 'delete': return Trash2
      case 'share': return Share2
      default: return Activity
    }
  }

  const stats = [
    { label: 'Total Actions Today', value: logs.length, icon: Activity, color: 'primary' },
    { label: 'Uploads', value: logs.filter(l => l.action?.toLowerCase().includes('upload')).length, icon: Upload, color: 'accent' },
    { label: 'Downloads', value: logs.filter(l => l.action?.toLowerCase().includes('download')).length, icon: Download, color: 'chart-4' },
    { label: 'Edits', value: logs.filter(l => l.action?.toLowerCase().includes('edit')).length, icon: Edit3, color: 'chart-3' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground">View all document and team activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activity</span>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading activity…
            </div>
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          {!loading && logs.length === 0 && (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
          {!loading && logs.length > 0 && (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const IconComponent = getActionIcon(log.action)
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground truncate">
                            {log.action} - {log.entity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by {log.actorName || log.actorEmail || 'Unknown'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
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
