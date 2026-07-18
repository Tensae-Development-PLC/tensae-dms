'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Send,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createAdminNotification, listAdminNotifications, listAdminUsers } from '@/lib/client-api'
import { useToast } from '@/hooks/use-toast'

type AdminUser = {
  id: string
  name: string | null
  email: string
}

type NotificationItem = {
  id: string
  title: string
  body: string
  createdAt: string
  readAt?: string | null
  user?: {
    id: string
    email: string
    fullName?: string | null
  }
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [history, setHistory] = useState<NotificationItem[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [composeOpen, setComposeOpen] = useState(false)
  const [recipientUserId, setRecipientUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const [adminUsers, noteRes] = await Promise.all([
          listAdminUsers(),
          listAdminNotifications(),
        ])
        if (!mounted) return
        setUsers(adminUsers as AdminUser[])
        setHistory(noteRes)
      } catch (e) {
        if (!mounted) return
        toast({
          title: 'Failed to load notifications',
          description: e instanceof Error ? e.message : 'Unable to fetch notifications',
          variant: 'destructive',
        })
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [toast])

  const unreadCount = useMemo(() => history.filter((n) => !n.readAt).length, [history])

  async function sendNotification() {
    if (!recipientUserId || !title.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Pick recipient, title, and message.', variant: 'destructive' })
      return
    }

    setSending(true)
    try {
      await createAdminNotification({
        userId: recipientUserId,
        title: title.trim(),
        body: message.trim(),
      })

      const refreshed = await listAdminNotifications()
      setHistory(refreshed)
      setTitle('')
      setMessage('')
      setRecipientUserId('')
      setComposeOpen(false)
      toast({ title: 'Notification sent', description: 'The user has received the notification.' })
    } catch (e) {
      toast({
        title: 'Send failed',
        description: e instanceof Error ? e.message : 'Could not send notification',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Live notifications and delivery from database records</p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>Compose and send a notification to a user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient</label>
                <Select value={recipientUserId} onValueChange={setRecipientUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {(u.name || u.email) + ' (' + u.email + ')'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="Write your notification message..." className="min-h-[120px]" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => void sendNotification()} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Send Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history" className="gap-2">
            <Bell className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <Users className="w-4 h-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading notifications...
            </div>
          )}
          {!loading && history.length === 0 && (
            <p className="text-sm text-muted-foreground">No notifications found.</p>
          )}
          {!loading && history.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        <Badge variant={notification.readAt ? 'secondary' : 'default'}>
                          {notification.readAt ? 'read' : 'new'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.body}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {notification.user?.fullName || notification.user?.email || 'Current user'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Notification Health</CardTitle>
              <CardDescription>Current delivery status snapshot</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Bell className="w-4 h-4" />
                  Total
                </div>
                <p className="text-2xl font-bold mt-2">{history.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Unread
                </div>
                <p className="text-2xl font-bold mt-2">{unreadCount}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Read
                </div>
                <p className="text-2xl font-bold mt-2">{history.length - unreadCount}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
