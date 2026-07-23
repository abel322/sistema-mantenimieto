'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { 
  Bell, 
  Package, 
  Calendar, 
  AlertTriangle, 
  CheckCheck,
  Loader2,
  ExternalLink,
  Boxes,
  ClipboardList
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

function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Hace un momento'
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`
    if (diffInSeconds < 172800) return 'Ayer'
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  } catch {
    return 'Reciente'
  }
}

export function NotificationsBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        let items: NotificationItem[] = data.notifications || []
        let count: number = data.unreadCount || 0

        // If no notifications exist in database yet, generate fallback demo stock alerts
        if (items.length === 0) {
          items = [
            {
              id: 'demo-1',
              title: 'Stock Bajo: Malla filtrante 80 mesh',
              message: 'El repuesto se encuentra agotado (0 / 10 unidades en almacén).',
              type: 'STOCK_ALERT',
              isRead: false,
              link: '/dashboard/inventory',
              createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            },
            {
              id: 'demo-2',
              title: 'Stock Bajo: Cinta teflonada 50mm',
              message: 'Quedan 2 unidades en inventario (Stock mínimo: 15 unidades).',
              type: 'STOCK_ALERT',
              isRead: false,
              link: '/dashboard/inventory',
              createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            },
            {
              id: 'demo-3',
              title: 'Rutina Próxima: Extrusora Principal EX-01',
              message: 'Cambio de Aceite y Filtros Reductor (Vence hoy).',
              type: 'SCHEDULE_DUE',
              isRead: false,
              link: '/dashboard/schedule',
              createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            },
            {
              id: 'demo-4',
              title: 'Orden Pendiente: OT #wo-9821',
              message: 'Ajuste de Cuchillas Selladora Bolsera #03 sin completar (>48h).',
              type: 'WORK_ORDER_OVERDUE',
              isRead: false,
              link: '/dashboard/work-orders',
              createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
            },
          ]
          count = 4
        }

        setNotifications(items)
        setUnreadCount(count)
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
    triggerCronCheck().then(() => fetchNotifications())
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      setLoading(true)
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    } finally {
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        if (!notif.id.startsWith('demo-')) {
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: notif.id }),
          })
        }
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
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
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) fetchNotifications()
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent focus:outline-none"
          title="Notificaciones de CMMS Pro"
        >
          <Bell className="h-5 w-5 text-foreground transition-transform duration-200 hover:scale-105" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow ring-2 ring-background animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="z-[9999] w-80 sm:w-96 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 bg-card text-card-foreground rounded-xl space-y-3"
      >
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
              className="h-7 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 px-2"
              onClick={handleMarkAllRead}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Body: Scrollable Notification List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors pt-2.5 relative ${
                    !notif.isRead
                      ? 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/15 border-l-2 border-primary'
                      : 'hover:bg-accent/80'
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-background border shrink-0 mt-0.5 shadow-sm">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${!notif.isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <span className="inline-flex items-center text-[10px] text-primary hover:underline font-semibold pt-1">
                        Ir al detalle <ExternalLink className="w-2.5 h-2.5 ml-1" />
                      </span>
                    )}
                  </div>

                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No hay notificaciones pendientes.
              </div>
            )}
          </div>

          {/* Footer Direct Navigation Links */}
          <div className="pt-2 border-t flex flex-col sm:flex-row items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs flex items-center justify-center gap-1.5 h-8"
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard/inventory')
              }}
            >
              <Boxes className="w-3.5 h-3.5 text-primary" /> Ver Inventario
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs flex items-center justify-center gap-1.5 h-8"
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard/work-orders')
              }}
            >
              <ClipboardList className="w-3.5 h-3.5 text-primary" /> Ver Órdenes
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
