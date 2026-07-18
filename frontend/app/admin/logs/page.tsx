'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileSearch, 
  Filter,
  Download,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { listAdminAuditRecent } from '@/lib/client-api'

interface AuditLog {
  id: string
  action: string
  entity: string
  createdAt: string
  actorEmail?: string | null
  actorName?: string | null
}

const getActionCategory = (action: string) => {
  const [category] = action.split('.')
  const colors: Record<string, string> = {
    user: 'primary',
    document: 'accent',
    company: 'chart-4',
    system: 'chart-3',
    storage: 'destructive',
    api_key: 'chart-2',
    role: 'chart-5',
    settings: 'chart-1',
  }
  return colors[category] || 'secondary'
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const entries = await listAdminAuditRecent(100)
      setLogs(entries)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load audit logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.actorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (log.action.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesAction = actionFilter === 'all' || log.action.startsWith(actionFilter)
    return matchesSearch && matchesAction
  })

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">System-wide activity and security logs</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user">User Actions</SelectItem>
                  <SelectItem value="document">Document Actions</SelectItem>
                  <SelectItem value="company">Company Actions</SelectItem>
                  <SelectItem value="system">System Actions</SelectItem>
                  <SelectItem value="api_key">API Key Actions</SelectItem>
                  <SelectItem value="storage">Storage Actions</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entity</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.action}</Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-muted-foreground">{log.entity}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-foreground">{log.actorName || 'System'}</p>
                          {log.actorEmail && (
                            <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(log.createdAt)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Showing {filteredLogs.length} of {logs.length} audit log entries</p>
      </div>
    </div>
  )
}
