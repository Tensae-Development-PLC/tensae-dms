'use client'

import { useState } from 'react'
import { AlertTriangle, Shield, Monitor, MapPin, Clock, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SecurityAlert {
  id: string
  type: 'failed_login' | 'new_device' | 'suspicious_activity' | 'password_change'
  title: string
  description: string
  ip: string
  location: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  dismissed: boolean
}

const initialAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'failed_login',
    title: 'Failed Login Attempt',
    description: '3 failed login attempts detected',
    ip: '192.168.1.45',
    location: 'New York, US',
    timestamp: '2 hours ago',
    severity: 'medium',
    dismissed: false,
  },
  {
    id: '2',
    type: 'new_device',
    title: 'New Device Login',
    description: 'Login from a new device: iPhone 15',
    ip: '10.0.0.123',
    location: 'Los Angeles, US',
    timestamp: '1 day ago',
    severity: 'low',
    dismissed: false,
  },
  {
    id: '3',
    type: 'suspicious_activity',
    title: 'Unusual Activity Detected',
    description: 'Multiple document downloads in short time',
    ip: '45.67.89.101',
    location: 'Unknown',
    timestamp: '3 days ago',
    severity: 'high',
    dismissed: false,
  },
  {
    id: '4',
    type: 'password_change',
    title: 'Password Changed',
    description: 'Your password was successfully changed',
    ip: '192.168.1.105',
    location: 'San Francisco, US',
    timestamp: '1 week ago',
    severity: 'low',
    dismissed: false,
  },
]

const severityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-destructive/10 text-destructive',
}

const typeIcons = {
  failed_login: AlertTriangle,
  new_device: Monitor,
  suspicious_activity: Shield,
  password_change: Shield,
}

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [filter, setFilter] = useState<string>('all')
  const [isExpanded, setIsExpanded] = useState(true)

  const visibleAlerts = alerts.filter(alert => {
    if (alert.dismissed) return false
    if (filter === 'all') return true
    return alert.type === filter
  })

  const dismissAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, dismissed: true } : alert
    ))
  }

  const dismissAll = () => {
    setAlerts(alerts.map(alert => ({ ...alert, dismissed: true })))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security Alerts
            </CardTitle>
            <CardDescription>Recent security events on your account</CardDescription>
          </div>
          {visibleAlerts.length > 0 && (
            <Badge variant="secondary">{visibleAlerts.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="failed_login">Failed Logins</SelectItem>
              <SelectItem value="new_device">New Devices</SelectItem>
              <SelectItem value="suspicious_activity">Suspicious</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {visibleAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-10 h-10 text-primary/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No security alerts</p>
              <p className="text-sm text-muted-foreground/70">Your account is secure</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((alert) => {
                const Icon = typeIcons[alert.type]
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl transition-colors",
                      alert.severity === 'high' 
                        ? 'bg-destructive/5 border border-destructive/10' 
                        : 'bg-secondary/30'
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      severityColors[alert.severity]
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0 h-8 w-8"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {alert.ip}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {visibleAlerts.length > 0 && (
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={dismissAll}>
                    Dismiss All
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
