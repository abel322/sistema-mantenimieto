'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { X, Save, Loader2 } from 'lucide-react'

interface AssetOption {
  id: string
  name: string
  code: string
}

interface ScheduleEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  const [frequencyType, setFrequencyType] = useState(schedule.frequencyType)
  const [nextDueDate, setNextDueDate] = useState(
    new Date(schedule.nextDueDate).toISOString().slice(0, 10)
  )

  const [assets, setAssets] = useState<AssetOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setAssetId(schedule.assetId)
      setTaskTemplate(schedule.taskTemplate)
      setFrequencyDays(schedule.frequencyDays?.toString() || '30')
      setFrequencyType(schedule.frequencyType)
      setNextDueDate(new Date(schedule.nextDueDate).toISOString().slice(0, 10))

      fetch('/api/assets')
        .then((res) => res.json())
        .then((data) => setAssets(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [isOpen, schedule])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTemplate.trim() || !nextDueDate) {
      setError('La descripción de la tarea y la fecha límite son obligatorias')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/schedule/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          taskTemplate,
          frequencyDays: parseInt(frequencyDays) || 30,
          frequencyType,
          nextDueDate,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar la programación')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al actualizar la programación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
          <h3 className="text-lg font-bold">Editar Programación de Mantenimiento</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="asset" className="font-semibold text-sm">
              Activo / Maquinaria *
            </Label>
            <Select
              id="asset"
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

          <div className="space-y-2">
            <Label htmlFor="taskTemplate" className="font-semibold text-sm">
              Tarea / Protocolo a Programar *
            </Label>
            <Input
              id="taskTemplate"
              value={taskTemplate}
              onChange={(e) => setTaskTemplate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequencyType" className="font-semibold text-sm">
                Tipo de Frecuencia
              </Label>
              <Select
                id="frequencyType"
                value={frequencyType}
                onChange={(e) => setFrequencyType(e.target.value)}
              >
                <option value="CALENDAR">Por Calendario (Días)</option>
                <option value="USAGE_HOURS">Por Horas de Uso</option>
                <option value="USAGE_METERS">Por Metros Producidos</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequencyDays" className="font-semibold text-sm">
                Frecuencia (Días) *
              </Label>
              <Input
                id="frequencyDays"
                type="number"
                min="1"
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextDueDate" className="font-semibold text-sm">
              Próxima Fecha Límite *
            </Label>
            <Input
              id="nextDueDate"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
            />
          </div>

          {/* Footer */}
          <div className="border-t pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
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
          </div>
        </form>
      </div>
    </div>
  )
}
