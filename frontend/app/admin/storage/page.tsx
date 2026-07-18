'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  HardDrive, 
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getAdminStorageMetrics } from '@/lib/client-api'

interface StorageMetrics {
  overall: {
    totalUsedGb: number
    totalLimitGb: number
    percentageUsed: number
  }
  companies: {
    tenantId: string
    name: string
    usedGb: number
    limitGb: number
    percentage: number
    usedBytes: string
    limitBytes: string
  }[]
  nearLimitCount: number
}

export default function StoragePage() {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const data = await getAdminStorageMetrics()
      setMetrics(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load storage metrics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStorageColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive'
    if (percentage >= 75) return 'chart-4'
    return 'accent'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Storage Management</h1>
          <p className="text-muted-foreground">Monitor and manage storage allocation</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Storage Management</h1>
          <p className="text-muted-foreground">Monitor and manage storage allocation</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Unable to load storage metrics</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = [
    { label: 'Total Storage', value: `${metrics.overall.totalLimitGb} GB`, icon: HardDrive, color: 'primary' },
    { label: 'Used Storage', value: `${metrics.overall.totalUsedGb} GB`, icon: HardDrive, color: 'accent' },
    { label: 'Available', value: `${(metrics.overall.totalLimitGb - metrics.overall.totalUsedGb).toFixed(1)} GB`, icon: HardDrive, color: 'chart-4' },
    { label: 'Near Limit', value: metrics.nearLimitCount.toString(), icon: AlertTriangle, color: 'destructive' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Storage Management</h1>
        <p className="text-muted-foreground">Monitor and manage storage allocation</p>
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
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Overall Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{metrics.overall.totalUsedGb} GB used of {metrics.overall.totalLimitGb} GB</span>
              <span className="text-foreground font-medium">{metrics.overall.percentageUsed}%</span>
            </div>
            <Progress value={metrics.overall.percentageUsed} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Company Storage List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage by Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.companies.map((company) => (
              <motion.div
                key={company.tenantId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2 pb-4 border-b last:pb-0 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.usedGb} GB used of {company.limitGb} GB</p>
                  </div>
                  <span className="text-sm font-medium">{company.percentage}%</span>
                </div>
                <Progress value={company.percentage} className="h-2" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

      {/* Per-Company Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Storage by Company</CardTitle>
          <Button variant="outline" size="sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            View Alerts
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {companyStorage.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{company.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {company.used} GB / {company.limit} GB
                    </span>
                    <span className={`text-sm font-medium ${
                      company.percentage >= 90 ? 'text-destructive' :
                      company.percentage >= 75 ? 'text-chart-4' :
                      'text-accent'
                    }`}>
                      {company.percentage}%
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={company.percentage} 
                    className={`h-2 ${
                      company.percentage >= 90 ? '[&>div]:bg-destructive' :
                      company.percentage >= 75 ? '[&>div]:bg-chart-4' :
                      ''
                    }`}
                  />
                  {company.percentage >= 75 && (
                    <AlertTriangle className={`absolute right-0 -top-1 w-4 h-4 ${
                      company.percentage >= 90 ? 'text-destructive' : 'text-chart-4'
                    }`} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
