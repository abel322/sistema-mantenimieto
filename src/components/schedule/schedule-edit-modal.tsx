'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { X, Save, Loader2, Calendar } from 'lucide-react'
import { updateScheduleAction } from '@/app/actions/schedules'

interface AssetOption {
  id: string
  name: string
  code: string
}

interface ScheduleEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedSchedule?: any) => void
  schedule: {
    id: string
    assetId: string
    frequencyDays?: number | null
    frequencyType: string
    nextDueDate: string | Date
    taskTemplate: string
    isActive?: boolean
  }
}

export function ScheduleEditModal({
  isOpen,
  onClose,
  onSuccess,
  schedule,
}: ScheduleEditModalProps) {
  const [assetId, setAssetId] = useState(schedule.assetId)
  const [taskTemplate, setTaskTemplate] = useState(schedule.taskTemplate)
  const [frequencyDays, setFrequencyDays] = useState(schedule.frequencyDays?.toString() || '30')
  const [frequencyType, setFrequencyType] = useState<any>(schedule.frequencyType || 'CALENDAR')
  const [nextDueDate, setNextDueDate] = useState(
    new Date(schedule.nextDueDate).toISOString().slice(0, 10)
  )

  const [assets, setAssets] = useState<AssetOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && schedule) {
      setAssetId(schedule.assetId)
      setTaskTemplate(schedule.taskTemplate)
      setFrequencyDays(schedule.frequencyDays?.toString() || '30')
      setFrequencyType(schedule.frequencyType || 'CALENDAR')
      setNextDueDate(new Date(schedule.nextDueDate).toISOString().slice(0, 10))

      fetch('/api/assets', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => setAssets(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [isOpen, schedule])

  if (!isOpen || !schedule) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTemplate.trim() || !nextDueDate) {
      setError('La descripción de la tarea y la fecha límite son obligatorias')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await updateScheduleAction(schedule.id, {
        assetId,
        taskTemplate,
        frequencyDays: parseInt(frequencyDays) || 30,
        frequencyType,
        nextDueDate,
      })

      if (!res.success) {
        throw new Error(res.error || 'Error al actualizar la programación')
      }

      onSuccess(res.schedule)
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al actualizar la programación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            Editar Programación de Mantenimiento
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} type="button" className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-1 space-y-4 pt-3">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="asset" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Activo / Maquinaria *
            </Label>
            <Select
              id="asset"
              className="w-full h-10 text-sm"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              required
            >
              {assets.map((ast) => (
                <option key={ast.id} value={ast.id}>
                  {ast.name} ({ast.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="taskTemplate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tarea / Protocolo a Programar *
            </Label>
            <Input
              id="taskTemplate"
              className="w-full h-10 text-sm"
              value={taskTemplate}
              onChange={(e) => setTaskTemplate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="frequencyType" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipo de Frecuencia
              </Label>
              <Select
                id="frequencyType"
                className="w-full h-10 text-sm"
                value={frequencyType}
                onChange={(e) => setFrequencyType(e.target.value)}
              >
                <option value="CALENDAR">Por Calendario (Días)</option>
                <option value="USAGE_HOURS">Por Horas de Uso</option>
                <option value="USAGE_METERS">Por Metros Producidos</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="frequencyDays" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Frecuencia (Días) *
              </Label>
              <Input
                id="frequencyDays"
                type="number"
                min="1"
                className="w-full h-10 text-sm"
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="nextDueDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Próxima Fecha Límite *
            </Label>
            <Input
              id="nextDueDate"
              type="date"
              className="w-full h-10 text-sm"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
            />
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto h-10">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto h-10 bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
