'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Building2, 
  TrendingUp,
  Calendar,
  Check,
  X,
  Clock,
  DollarSign,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Ban
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
  { 
    title: 'Monthly Revenue', 
    value: '$24,580', 
    change: '+12.5%',
    icon: DollarSign,
  },
  { 
    title: 'Active Subscriptions', 
    value: '42', 
    change: '+3 this month',
    icon: CreditCard,
  },
  { 
    title: 'Expiring Soon', 
    value: '8', 
    change: 'Next 30 days',
    icon: Clock,
  },
  { 
    title: 'Renewal Rate', 
    value: '94%', 
    change: '+2% from last month',
    icon: TrendingUp,
  },
]

const subscriptions = [
  { 
    id: 'SUB-001',
    company: 'ABC Corporation',
    plan: 'Enterprise',
    status: 'active',
    amount: '$599/mo',
    users: 50,
    storage: '500GB',
    nextBilling: '2024-04-15',
    startDate: '2023-04-15'
  },
  { 
    id: 'SUB-002',
    company: 'Tech Solutions Ltd',
    plan: 'Professional',
    status: 'active',
    amount: '$299/mo',
    users: 25,
    storage: '250GB',
    nextBilling: '2024-04-20',
    startDate: '2023-06-20'
  },
  { 
    id: 'SUB-003',
    company: 'Global Industries',
    plan: 'Enterprise',
    status: 'expiring',
    amount: '$599/mo',
    users: 75,
    storage: '500GB',
    nextBilling: '2024-04-05',
    startDate: '2023-04-05'
  },
  { 
    id: 'SUB-004',
    company: 'StartUp Inc',
    plan: 'Starter',
    status: 'active',
    amount: '$99/mo',
    users: 10,
    storage: '50GB',
    nextBilling: '2024-04-25',
    startDate: '2024-01-25'
  },
  { 
    id: 'SUB-005',
    company: 'Legacy Systems',
    plan: 'Professional',
    status: 'cancelled',
    amount: '$299/mo',
    users: 15,
    storage: '250GB',
    nextBilling: '-',
    startDate: '2022-08-10'
  },
  { 
    id: 'SUB-006',
    company: 'Innovation Labs',
    plan: 'Enterprise',
    status: 'past_due',
    amount: '$599/mo',
    users: 40,
    storage: '500GB',
    nextBilling: '2024-03-28',
    startDate: '2023-03-28'
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-accent/10 text-accent border-accent/20">Active</Badge>
    case 'expiring':
      return <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">Expiring Soon</Badge>
    case 'cancelled':
      return <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Cancelled</Badge>
    case 'past_due':
      return <Badge variant="destructive">Past Due</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getPlanBadge = (plan: string) => {
  switch (plan) {
    case 'Enterprise':
      return <Badge className="bg-primary/10 text-primary border-primary/20">Enterprise</Badge>
    case 'Professional':
      return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Professional</Badge>
    case 'Starter':
      return <Badge variant="secondary">Starter</Badge>
    default:
      return <Badge variant="outline">{plan}</Badge>
  }
}

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sub.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">Manage company subscriptions and billing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subscriptionStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-accent" />
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Subscriptions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                All Subscriptions
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Users</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Next Billing</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub, index) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{sub.company}</p>
                            <p className="text-xs text-muted-foreground">{sub.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">{getPlanBadge(sub.plan)}</td>
                      <td className="py-4 px-4">{getStatusBadge(sub.status)}</td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-foreground">{sub.amount}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-muted-foreground">{sub.users} users</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{sub.nextBilling}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <CreditCard className="w-4 h-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Mail className="w-4 h-4" />
                              Send Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Ban className="w-4 h-4" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
