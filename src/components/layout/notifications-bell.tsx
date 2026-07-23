'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { 
  Bell, 
  Package, 
  Calendar, 
  AlertTriangle, 
  CheckCheck,
  Loader2,
  ExternalLink
} from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'STOCK_ALERT' | 'SCHEDULE_DUE' | 'WORK_ORDER_OVERDUE' | string
  isRead: boolean
  link?: string | null
  createdAt: string
}

export function NotificationsBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const triggerCronCheck = async () => {
    try {
      await fetch('/api/cron/check-schedules')
    } catch (error) {
      console.error('Error triggering cron schedule check:', error)
    }
  }

  useEffect(() => {
    // Run cron check once on mount then fetch notifications
    triggerCronCheck().then(() => fetchNotifications())

    // Interval fetch every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleMarkAllRead = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      if (res.ok) {
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id }),
        })
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
    setIsOpen(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'STOCK_ALERT':
        return <Package className="w-4 h-4 text-amber-500 shrink-0" />
      case 'SCHEDULE_DUE':
        return <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
      case 'WORK_ORDER_OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
      default:
        return <Bell className="w-4 h-4 text-primary shrink-0" />
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        title="Notificaciones"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border bg-background p-4 shadow-2xl animate-in fade-in zoom-in-95 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Notificaciones</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Marcar leídas
              </Button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors pt-2.5 ${
                    !notif.isRead
                      ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-background border shrink-0 mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <span className="inline-flex items-center text-[10px] text-primary hover:underline font-medium pt-1">
                        Ver detalle <ExternalLink className="w-2.5 h-2.5 ml-1" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No hay notificaciones recientes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
