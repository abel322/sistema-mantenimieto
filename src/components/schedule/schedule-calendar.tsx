'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScheduleFormModal } from '@/components/schedule/schedule-form-modal'
import {
  Plus,
  Loader2,
  Eye,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
})

interface BigCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  color: string
  type: 'WORK_ORDER' | 'SCHEDULE'
  originalId: string
  assetName: string
  status?: string
  priority?: string
  orderType?: string
  technicianName?: string
}

export function ScheduleCalendar() {
  const router = useRouter()
  const [events, setEvents] = useState<BigCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Responsive state detection
  const [isMobile, setIsMobile] = useState(false)

  // Calendar view navigation states
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<any>(Views.MONTH)

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Event detail modal state
  const [selectedEvent, setSelectedEvent] = useState<BigCalendarEvent | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setCurrentView(mobile ? Views.AGENDA : Views.MONTH)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const [schedulesRes, ordersRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/work-orders'),
      ])

      const rawEvents: BigCalendarEvent[] = []

      // Map Scheduled Maintenance Routines
      if (schedulesRes.ok) {
        const schedules = await schedulesRes.json()
        if (Array.isArray(schedules)) {
          schedules.forEach((sch) => {
            const startDate = new Date(sch.nextDueDate)
            rawEvents.push({
              id: `sch-${sch.id}`,
              title: `${sch.asset?.name || 'Activo'}: ${sch.taskTemplate}`,
              start: startDate,
              end: startDate,
              allDay: true,
              color: '#059669', // Green (Preventivo Programado)
              type: 'SCHEDULE',
              originalId: sch.id,
              assetName: sch.asset?.name || 'Activo',
              status: sch.isActive ? 'PROGRAMADO' : 'INACTIVO',
            })
          })
        }
      }

      // Map Work Orders
      if (ordersRes.ok) {
        const orders = await ordersRes.json()
        if (Array.isArray(orders)) {
          orders.forEach((wo) => {
            let color = '#3b82f6' // Blue (En progreso)

            if (wo.status === 'CLOSED') {
              color = '#64748b' // Gray (Cerrado)
            } else if (wo.type === 'CORRECTIVE' || wo.priority === 'HIGH' || wo.priority === 'CRITICAL') {
              color = '#dc2626' // Red (Correctivo / Urgente)
            } else if (wo.type === 'PREVENTIVE' && wo.status === 'OPEN') {
              color = '#059669' // Green (Preventivo Abierto)
            }

            const startDate = new Date(wo.createdAt)
            rawEvents.push({
              id: `wo-${wo.id}`,
              title: `OT #${wo.id.slice(0, 6)}: ${wo.asset?.name} - ${wo.title}`,
              start: startDate,
              end: startDate,
              allDay: true,
              color,
              type: 'WORK_ORDER',
              originalId: wo.id,
              assetName: wo.asset?.name || 'Activo',
              status: wo.status,
              priority: wo.priority,
              orderType: wo.type,
              technicianName: wo.technician?.name || 'Técnico',
            })
          })
        }
      }

      setEvents(rawEvents)
    } catch (error) {
      console.error('Error loading calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendarData()
  }, [])

  // Event Styling Callback for React Big Calendar
  const eventStyleGetter = (event: BigCalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '6px',
        opacity: 0.95,
        color: '#ffffff',
        border: 'none',
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: '600',
        padding: '2px 6px',
      },
    }
  }

  // Handle Select Slot (Clicking an empty day cell)
  const handleSelectSlot = ({ start }: { start: Date }) => {
    const formattedDate = format(start, 'yyyy-MM-dd')
    setSelectedDate(formattedDate)
    setIsCreateModalOpen(true)
  }

  // Handle Select Event (Clicking an event badge)
  const handleSelectEvent = (event: BigCalendarEvent) => {
    setSelectedEvent(event)
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      {/* Calendar Header Indicator Legend */}
      <Card className="p-4 bg-card border">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="font-semibold text-foreground">Leyenda de Estado:</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              Preventivo Programado
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
              En Progreso
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
              Correctivo / Urgente
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-slate-500 inline-block"></span>
              Cerrado / Completado
            </span>
          </div>

          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1" /> Programar Mantenimiento
          </Button>
        </div>
      </Card>

      {/* React Big Calendar Container */}
      <Card className="p-2 sm:p-4 bg-card border shadow-sm max-w-full overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Cargando eventos del calendario...</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 p-2 sm:p-4">
            <div className="min-w-[600px] sm:min-w-full h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                culture="es"
                selectable={true}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                view={currentView}
                date={currentDate}
                onView={(view) => setCurrentView(view)}
                onNavigate={(date) => setCurrentDate(date)}
                messages={{
                  next: isMobile ? '>' : 'Siguiente',
                  previous: isMobile ? '<' : 'Anterior',
                  today: isMobile ? '•' : 'Hoy',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Día',
                  agenda: 'Agenda',
                  date: 'Fecha',
                  time: 'Hora',
                  event: 'Evento',
                  noEventsInRange: 'No hay mantenimientos programados en este rango.',
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Quick Schedule Creation Modal */}
      <ScheduleFormModal
        isOpen={isCreateModalOpen}
        initialDate={selectedDate}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchCalendarData()
          router.refresh()
        }}
      />

      {/* Quick Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="space-y-1">
                <Badge
                  style={{ backgroundColor: selectedEvent.color, color: '#ffffff' }}
                  className="font-bold text-xs"
                >
                  {selectedEvent.type === 'WORK_ORDER' ? 'Orden de Trabajo' : 'Rutina Programada'}
                </Badge>
                <h3 className="text-base font-bold text-foreground leading-tight pt-1">
                  {selectedEvent.title}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between border-b py-1">
                <span>Activo Afectado:</span>
                <span className="font-semibold text-foreground">{selectedEvent.assetName}</span>
              </div>

              <div className="flex justify-between border-b py-1">
                <span>Fecha Programada:</span>
                <span className="font-mono text-foreground">{format(selectedEvent.start, 'yyyy-MM-dd')}</span>
              </div>

              {selectedEvent.status && (
                <div className="flex justify-between border-b py-1">
                  <span>Estado:</span>
                  <span className="font-semibold text-foreground">{selectedEvent.status}</span>
                </div>
              )}

              {selectedEvent.technicianName && (
                <div className="flex justify-between border-b py-1">
                  <span>Técnico:</span>
                  <span className="font-semibold text-foreground">{selectedEvent.technicianName}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Cerrar
              </Button>
              {selectedEvent.type === 'WORK_ORDER' && (
                <Link href={`/dashboard/work-orders/${selectedEvent.originalId}`}>
                  <Button>
                    <Eye className="w-4 h-4 mr-1.5" /> Ver Orden de Trabajo
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
