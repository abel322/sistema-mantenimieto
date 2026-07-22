'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { X, Calendar as CalendarIcon, Save, Loader2 } from 'lucide-react'

interface AssetOption {
  id: string
  name: string
  code: string
}

interface ScheduleFormModalProps {
  isOpen: boolean
  initialDate?: string
  onClose: () => void
  onSuccess: () => void
}

export function ScheduleFormModal({
  isOpen,
  initialDate,
  onClose,
  onSuccess,
}: ScheduleFormModalProps) {
  const [assetId, setAssetId] = useState('')
  const [taskTemplate, setTaskTemplate] = useState('')
  const [frequencyDays, setFrequencyDays] = useState('30')
  const [frequencyType, setFrequencyType] = useState('CALENDAR')
  const [nextDueDate, setNextDueDate] = useState('')

  const [assets, setAssets] = useState<AssetOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (initialDate) {
        setNextDueDate(initialDate)
      } else {
        setNextDueDate(new Date().toISOString().slice(0, 10))
      }

      fetch('/api/assets')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setAssets(data)
            if (!assetId) setAssetId(data[0].id)
          }
        })
        .catch(console.error)
    }
  }, [isOpen, initialDate])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assetId || !taskTemplate.trim() || !nextDueDate) {
      setError('Por favor completa el activo, la rutina y la fecha limite.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
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
        throw new Error(data.error || 'Error al programar mantenimiento')
      }

      setTaskTemplate('')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al programar mantenimiento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-primary/10 border-primary/20">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <CalendarIcon className="w-5 h-5" />
            <span>Programar Mantenimiento</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form Body */}
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
              Rutina / Protocolo a Programar *
            </Label>
            <Input
              id="taskTemplate"
              placeholder="Ej. Inspección Mensual de Sellado / Cambio de Rodamientos"
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
              Fecha Límite Seleccionada *
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Programando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Guardar Programación
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
