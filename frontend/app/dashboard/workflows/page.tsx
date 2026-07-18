'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Workflow, 
  CheckCircle, 
  Clock, 
  XCircle,
  User,
  ArrowRight,
  Plus,
  FileText,
  Archive,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listWorkflows } from '@/lib/client-api'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const list = await listWorkflows()
        if (!mounted) return
        setWorkflows(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!mounted) return
        setErr(e instanceof Error ? e.message : 'Failed to load workflows')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const stats = [
    { label: 'Active Workflows', value: workflows.length, icon: Workflow, color: 'primary' },
    { label: 'Pending Approval', value: 0, icon: Clock, color: 'chart-4' },
    { label: 'Completed Today', value: 0, icon: CheckCircle, color: 'accent' },
    { label: 'Overdue', value: 0, icon: XCircle, color: 'destructive' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground">Track and manage document approval workflows</p>
        </div>
        <Button className="glow-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
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

      {/* Workflow Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Active Workflows</h2>
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading workflows…
          </div>
        )}
        {err && <p className="text-sm text-destructive">{err}</p>}
        {!loading && workflows.length === 0 && (
          <p className="text-sm text-muted-foreground">No workflows yet.</p>
        )}
        {!loading && workflows.length > 0 && (
          <div className="grid gap-4">
            {workflows.map((workflow: any) => (
              <Card key={workflow.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Workflow className="w-5 h-5 text-primary" />
                        {workflow.name || 'Untitled Workflow'}
                      </CardTitle>
                    </div>
                    <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {workflow.definition ? 'Custom workflow' : 'No definition'}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
