'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, Search, Users, FileText, HardDrive, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { listAdminTenants } from '@/lib/client-api'
import { formatMegabytes } from '@/lib/format'

export type TenantRow = {
  id: string
  name: string
  slug: string
  companyName: string
  userCount: number
  documentCount: number
  storageUsedMb: number
  storageLimitMb: number
  createdAt: string
}

export default function CompaniesPage() {
  const [rows, setRows] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let m = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const list = await listAdminTenants()
        if (m) setRows(list)
      } catch (e) {
        if (m) setErr(e instanceof Error ? e.message : 'Failed to load tenants')
      } finally {
        if (m) setLoading(false)
      }
    })()
    return () => {
      m = false
    }
  }, [])

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.companyName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [rows, searchQuery],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground">Tenants registered in the platform.</p>
        </div>
        <Button variant="outline" size="sm" type="button" disabled>
          Provision tenant (API)
        </Button>
      </div>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tenants..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading tenants…
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left p-4 font-medium">Tenant</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Company</th>
                  <th className="text-right p-4 font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      <Users className="w-4 h-4" /> Users
                    </span>
                  </th>
                  <th className="text-right p-4 font-medium hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 justify-end">
                      <FileText className="w-4 h-4" /> Docs
                    </span>
                  </th>
                  <th className="text-right p-4 font-medium hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 justify-end">
                      <HardDrive className="w-4 h-4" /> Storage
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const pct =
                    c.storageLimitMb > 0
                      ? Math.min(100, Math.round((c.storageUsedMb / c.storageLimitMb) * 100))
                      : 0
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">{c.companyName}</td>
                      <td className="p-4 text-right">{c.userCount}</td>
                      <td className="p-4 text-right hidden sm:table-cell">{c.documentCount}</td>
                      <td className="p-4 text-right hidden lg:table-cell text-muted-foreground">
                        {formatMegabytes(c.storageUsedMb)} / {formatMegabytes(c.storageLimitMb)} ({pct}%)
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">No tenants match your search.</p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
