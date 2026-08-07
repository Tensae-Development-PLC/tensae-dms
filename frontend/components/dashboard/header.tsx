'use client'

import { useState, useEffect, useCallback } from 'react'
import { Menu, Search, Bell, User, ChevronDown, LogOut, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getProfile, listNotifications, markAllNotificationsRead } from '@/lib/client-api'
import { logout } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

type NotificationItem = {
  id: string
  title: string
  body: string
  readAt?: string | null
  createdAt: string
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [profile, setProfile] = useState<{ fullName?: string; email?: string } | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true)
    try {
      const data = await listNotifications()
      setNotifications(data)
    } catch {
      setNotifications([])
    } finally {
      setLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getProfile()
        if (!mounted) return
        setProfile({ fullName: data.fullName, email: data.email })
      } catch {
        /* keep defaults */
      }
    })()
    void loadNotifications()
    return () => {
      mounted = false
    }
  }, [loadNotifications])

  useEffect(() => {
    if (showNotifications) void loadNotifications()
  }, [showNotifications, loadNotifications])

  async function onMarkAllRead(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    } catch {
      /* noop */
    }
  }

  const initials = (() => {
    const name = profile?.fullName || profile?.email || ''
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })()

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block relative w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9 bg-secondary/50 border-none focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="sm:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
            <Search className="w-5 h-5" />
          </button>

          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={onMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingNotifications && (
                <DropdownMenuItem disabled className="text-sm text-muted-foreground">
                  Loading…
                </DropdownMenuItem>
              )}
              {!loadingNotifications && notifications.length === 0 && (
                <DropdownMenuItem disabled className="text-sm text-muted-foreground">
                  No notifications yet
                </DropdownMenuItem>
              )}
              {!loadingNotifications &&
                notifications.slice(0, 8).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-3 cursor-pointer ${!notification.readAt ? 'bg-secondary/40' : ''}`}
                  >
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.body}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="justify-center text-primary cursor-pointer">
                <Link href="/dashboard/alerts">View all notifications</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {initials}
                </div>
                <span className="hidden md:block text-sm font-medium">{profile?.fullName ?? 'User'}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{profile?.fullName ?? 'User'}</span>
                  <span className="text-xs font-normal text-muted-foreground">{profile?.email ?? ''}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive cursor-pointer"
                onClick={async () => {
                  await logout()
                  router.push('/login')
                }}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
