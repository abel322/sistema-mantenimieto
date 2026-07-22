'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ScheduleEditModal } from '@/components/schedule/schedule-edit-modal'
import {
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Schedule {
  id: string
  assetId: string
  frequencyDays?: number | null
  frequencyType: string
  nextDueDate: string
  taskTemplate: string
  isActive: boolean
  asset: { id: string; name: string; code: string }
}

const frequencyTypeLabels: Record<string, string> = {
  CALENDAR: 'Por Calendario',
  USAGE_HOURS: 'Por Horas de Uso',
  USAGE_METERS: 'Por Metros Producidos',
}

export function ScheduleList() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  // Edit modal state
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  // Delete modal state
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedule')
      if (res.ok) {
        const data = await res.json()
        setSchedules(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleDelete = async () => {
    if (!deletingSchedule) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/schedule/${deletingSchedule.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSchedules((prev) => prev.filter((s) => s.id !== deletingSchedule.id))
        setDeletingSchedule(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Cargando programaciones de mantenimiento...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const isOverdue = new Date(schedule.nextDueDate) < new Date()
        const isDueSoon =
          new Date(schedule.nextDueDate) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        return (
          <Card
            key={schedule.id}
            className={`hover:border-primary/40 transition-colors ${
              isOverdue
                ? 'border-destructive'
                : isDueSoon
                ? 'border-yellow-500'
                : ''
            }`}
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base md:text-lg font-semibold truncate">
                      {schedule.asset?.name || 'Activo'}
                    </h3>
                    <Badge
                      variant={
                        isOverdue
                          ? 'destructive'
                          : isDueSoon
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {isOverdue
                        ? 'Vencido'
                        : isDueSoon
                        ? 'Próximo'
                        : 'Programado'}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground font-medium">
                    {schedule.taskTemplate}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-4 w-4 text-primary" />
                      {formatDate(schedule.nextDueDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {frequencyTypeLabels[schedule.frequencyType] || schedule.frequencyType}
                    </span>
                    {schedule.frequencyDays && (
                      <span className="font-semibold">Cada {schedule.frequencyDays} días</span>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setEditingSchedule(schedule)}
                    title="Editar Programación"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingSchedule(schedule)}
                    title="Eliminar Programación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {schedules.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay programaciones de mantenimiento activas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingSchedule && (
        <ScheduleEditModal
          isOpen={!!editingSchedule}
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={() => {
            fetchSchedules()
            router.refresh()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Programación?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de eliminar la programación <strong>"{deletingSchedule.taskTemplate}"</strong> para el activo <strong>{deletingSchedule.asset?.name}</strong>? Esta acción no se puede deshacer.
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
                onClick={handleDelete}
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
