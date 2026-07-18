'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  TrendingUp,
  Clock,
  DollarSign,
  Filter,
  Download,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const subscriptionStats = [
  { title: 'Monthly Revenue', value: '$24,580', change: '+12.5%', icon: DollarSign },
  { title: 'Active Subscriptions', value: '42', change: '+3 this month', icon: CreditCard },
  { title: 'Expiring Soon', value: '8', change: 'Next 30 days', icon: Clock },
  { title: 'Renewal Rate', value: '94%', change: '+2% from last month', icon: TrendingUp },
]

const subscriptions = [
  { id: 'SUB-001', company: 'ABC Corporation', plan: 'Enterprise', status: 'active', amount: '$599/mo', users: 50, storage: '500GB', nextBilling: '2024-04-15' },
  { id: 'SUB-002', company: 'Tech Solutions Ltd', plan: 'Professional', status: 'active', amount: '$299/mo', users: 25, storage: '250GB', nextBilling: '2024-04-20' },
  { id: 'SUB-003', company: 'Global Industries', plan: 'Enterprise', status: 'expiring', amount: '$599/mo', users: 75, storage: '500GB', nextBilling: '2024-04-05' },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-accent/10 text-accent border-accent/20">Active</Badge>
    case 'expiring':
      return <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">Expiring Soon</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

/** Shell UI retained for when BILLING_ENABLED is true — wire payment provider later. */
export default function SubscriptionsAdminView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">Manage company subscriptions and billing</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subscriptionStats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-xs text-accent">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <CardTitle>All subscriptions</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{sub.company}</p>
                  {getStatusBadge(sub.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {sub.id} · {sub.plan} · {sub.amount} · {sub.users} users · {sub.storage}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View details</DropdownMenuItem>
                  <DropdownMenuItem>Send invoice</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
