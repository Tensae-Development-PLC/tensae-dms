'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  HardDrive,
  FileText,
  Activity,
  Shield,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAdminOverview, listAdminAuditRecent } from '@/lib/client-api'
import { formatBytes } from '@/lib/format'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getAdminOverview>> | null>(null)
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof listAdminAuditRecent>>>([])

  useEffect(() => {
    let m = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const [o, a] = await Promise.all([getAdminOverview(), listAdminAuditRecent(12)])
        if (!m) return
        setOverview(o)
        setActivity(a)
      } catch (e) {
        if (!m) return
        setErr(e instanceof Error ? e.message : 'Failed to load admin data')
      } finally {
        if (m) setLoading(false)
      }
    })()
    return () => {
      m = false
    }
  }, [])

  const stats = overview
    ? [
        {
          title: 'Tenants',
          value: String(overview.counts.tenants),
          icon: Building2,
          href: '/admin/companies',
        },
        {
          title: 'Active users',
          value: String(overview.counts.users),
          icon: Users,
          href: '/admin/users',
        },
        {
          title: 'Documents',
          value: String(overview.counts.documents),
          icon: FileText,
          href: '/admin/reports',
        },
        {
          title: 'Storage (bytes)',
          value: formatBytes(overview.storageBytesTotal),
          icon: HardDrive,
          href: '/admin/storage',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin dashboard</h1>
          <p className="text-muted-foreground">Platform-wide metrics from the live database.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/security">
            <Shield className="w-4 h-4 mr-2" />
            Security center
          </Link>
        </Button>
      </div>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Link href={stat.href}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                          <p className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                          {overview ? (
                            <p className="text-xs text-muted-foreground mt-2">
                              Audit events (24h): {overview.counts.auditEvents24h}
                            </p>
                          ) : null}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <stat.icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent audit activity
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/logs">
                    Logs
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No audit entries yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {activity.map((a) => (
                      <li key={a.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                        <p className="text-sm font-medium text-foreground">{a.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.entity}
                          {a.actorEmail ? ` · ${a.actorEmail}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(a.createdAt).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-between" asChild>
                  <Link href="/admin/companies">
                    Tenant directory
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="justify-between" asChild>
                  <Link href="/admin/security">
                    Global security
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="justify-between" asChild>
                  <Link href="/admin/storage">
                    Storage
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
