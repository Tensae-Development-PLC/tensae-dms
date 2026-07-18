'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  HardDrive,
  FileSearch,
  Settings,
  X,
  ChevronRight,
  Shield,
  CreditCard,
  BarChart3,
  Bell,
} from 'lucide-react'
import { isBillingEnabled } from '@/lib/public-url'

const baseMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Building2, label: 'Companies', href: '/admin/companies' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Shield, label: 'Security', href: '/admin/security' },
  { icon: CreditCard, label: 'Subscriptions', href: '/admin/subscriptions', billingOnly: true },
  { icon: HardDrive, label: 'Storage', href: '/admin/storage' },
  { icon: BarChart3, label: 'Reports', href: '/admin/reports' },
  { icon: FileSearch, label: 'Audit Logs', href: '/admin/logs' },
  { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
]

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const billingOn = isBillingEnabled()
  const menuItems = baseMenuItems.filter((item) => !('billingOnly' in item && item.billingOnly) || billingOn)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-destructive" />
          </div>
          <span className="font-bold text-sidebar-foreground">Admin Panel</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-destructive/10 text-destructive"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-destructive")} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-destructive" />}
                </Link>
              </li>
            )
          })}
        </ul>

        {!billingOn && (
          <div className="mt-4 mx-1 p-3 rounded-lg bg-sidebar-accent/40 text-xs text-sidebar-foreground/60">
            Billing is disabled (free tier). Set <code className="text-[10px]">NEXT_PUBLIC_BILLING_ENABLED=true</code> to enable subscriptions.
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <Settings className="w-4 h-4" />
          Back to workspace
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </div>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
