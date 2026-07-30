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
import { ScheduleEditModal } from '@/components/schedule/schedule-edit-modal'
import {
  Plus,
  Loader2,
  Eye,
  X,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ScheduleItem } from './schedule-list'

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

export interface BigCalendarEvent {
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
  rawSchedule?: ScheduleItem
}

interface ScheduleCalendarProps {
  schedules: ScheduleItem[]
  workOrders: any[]
  loading?: boolean
  onDeleteSchedule: (id: string) => Promise<void>
  onUpdateSchedule: (updatedSchedule: any) => void
  onRefresh: () => void
}

export function ScheduleCalendar({
  schedules,
  workOrders,
  loading = false,
  onDeleteSchedule,
  onUpdateSchedule,
  onRefresh,
}: ScheduleCalendarProps) {
  const router = useRouter()

  // Responsive state detection (< 640px breakpoint)
  const [isMobile, setIsMobile] = useState<boolean>(false)

  // Calendar view navigation states
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<any>(Views.MONTH)

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Event detail & action modals
  const [selectedEvent, setSelectedEvent] = useState<BigCalendarEvent | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches
      setIsMobile(mobile)
      if (mobile) {
        setCurrentView(Views.AGENDA)
      }
    }

    handleMediaChange(mediaQuery)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange)
      return () => mediaQuery.removeEventListener('change', handleMediaChange)
    } else {
      mediaQuery.addListener(handleMediaChange)
      return () => mediaQuery.removeListener(handleMediaChange)
    }
  }, [])

  // Reactively compute calendar events whenever schedules or workOrders change
  const events = useMemo(() => {
    const rawEvents: BigCalendarEvent[] = []

    // Map Scheduled Maintenance Routines
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
          rawSchedule: sch,
        })
      })
    }

    // Map Work Orders
    if (Array.isArray(workOrders)) {
      workOrders.forEach((wo) => {
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
          title: `OT #${wo.id.slice(0, 6)}: ${wo.asset?.name || 'Activo'} - ${wo.title}`,
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

    return rawEvents
  }, [schedules, workOrders])

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
        cursor: 'pointer',
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

  const handleDeleteFromCalendar = async () => {
    if (!deletingSchedule) return
    setDeleting(true)
    try {
      await onDeleteSchedule(deletingSchedule.id)
      setDeletingSchedule(null)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error deleting schedule from calendar:', error)
    } finally {
      setDeleting(false)
    }
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
            <style jsx global>{`
              .rbc-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1rem;
              }
              .rbc-toolbar-label {
                font-weight: 700;
                font-size: 0.95rem;
                padding: 0.25rem 0.5rem;
                width: 100%;
                text-align: center;
              }
              @media (min-width: 640px) {
                .rbc-toolbar-label {
                  width: auto;
                }
              }
              .rbc-btn-group {
                display: inline-flex;
                flex-wrap: wrap;
                gap: 0.25rem;
              }
              .rbc-toolbar button {
                padding: 0.35rem 0.75rem;
                font-size: 0.8rem;
                border-radius: 0.375rem;
                border: 1px solid var(--border, #e2e8f0);
              }
            `}</style>
            <div className="min-w-[550px] sm:min-w-full h-[600px]">
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
          onRefresh()
          router.refresh()
        }}
      />

      {/* Quick Event Detail & Actions Modal */}
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

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Cerrar
              </Button>

              {selectedEvent.type === 'WORK_ORDER' ? (
                <Link href={`/dashboard/work-orders/${selectedEvent.originalId}`}>
                  <Button size="sm">
                    <Eye className="w-4 h-4 mr-1.5" /> Ver Orden de Trabajo
                  </Button>
                </Link>
              ) : selectedEvent.rawSchedule ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 dark:text-blue-400 hover:bg-blue-50"
                    onClick={() => {
                      setEditingSchedule(selectedEvent.rawSchedule!)
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1 text-blue-500" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeletingSchedule(selectedEvent.rawSchedule!)
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal from Calendar */}
      {editingSchedule && (
        <ScheduleEditModal
          isOpen={!!editingSchedule}
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={(updated) => {
            if (updated) onUpdateSchedule(updated)
            setSelectedEvent(null)
            onRefresh()
          }}
        />
      )}

      {/* Delete Confirmation Modal from Calendar */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Programación?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de eliminar la programación <strong>"{deletingSchedule.taskTemplate}"</strong> para el activo <strong>{deletingSchedule.asset?.name}</strong>? Esta acción actualizará inmediatamente el calendario.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingSchedule(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteFromCalendar}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Eliminando...
                  </>
                ) : (
                  'Confirmar Eliminación'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
