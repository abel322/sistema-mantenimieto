'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { X, Save, Loader2, AlertTriangle, Clock } from 'lucide-react'
import { updateFailureReport } from '@/app/actions/failures'

export interface FailureLogData {
  id: string
  assetId: string
  symptom: string
  rootCause?: string | null
  downtimeHours: number
  reportedAt: Date | string
  resolvedAt?: Date | string | null
  asset?: {
    id: string
    name: string
    code: string
  } | null
}

interface EditFailureModalProps {
  isOpen: boolean
  failureLog: FailureLogData | null
  onClose: () => void
  onSuccess: (updatedLog?: any) => void
}

interface AssetOption {
  id: string
  name: string
  code: string
}

export function EditFailureModal({
  isOpen,
  failureLog,
  onClose,
  onSuccess,
}: EditFailureModalProps) {
  const [symptom, setSymptom] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [downtimeHours, setDowntimeHours] = useState('0')
  const [reportedAt, setReportedAt] = useState('')
  const [resolvedAt, setResolvedAt] = useState('')
  const [assetId, setAssetId] = useState('')
  const [assets, setAssets] = useState<AssetOption[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && failureLog) {
      setSymptom(failureLog.symptom || '')
      setRootCause(failureLog.rootCause || '')
      setDowntimeHours(failureLog.downtimeHours?.toString() || '0')
      setAssetId(failureLog.assetId || '')

      if (failureLog.reportedAt) {
        const d = new Date(failureLog.reportedAt)
        setReportedAt(d.toISOString().slice(0, 16))
      } else {
        setReportedAt(new Date().toISOString().slice(0, 16))
      }

      if (failureLog.resolvedAt) {
        const d = new Date(failureLog.resolvedAt)
        setResolvedAt(d.toISOString().slice(0, 16))
      } else {
        setResolvedAt('')
      }

      setError(null)

      fetch('/api/assets')
        .then((res) => res.json())
        .then((data) => setAssets(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [isOpen, failureLog])

  if (!isOpen || !failureLog) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symptom.trim()) {
      setError('La descripción o síntoma de la falla es obligatorio')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const result = await updateFailureReport(failureLog.id, {
        symptom,
        rootCause: rootCause || null,
        downtimeHours: parseFloat(downtimeHours) || 0,
        reportedAt: reportedAt ? new Date(reportedAt).toISOString() : new Date().toISOString(),
        resolvedAt: resolvedAt ? new Date(resolvedAt).toISOString() : null,
        assetId: assetId || failureLog.assetId,
      })

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar el registro de falla')
      }

      onSuccess(result.failureLog)
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al procesar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            Editar Registro de Falla
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            type="button"
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          {/* Activo Afectado */}
          {assets.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="assetId" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Activo / Máquina Afectada *
              </Label>
              <Select
                id="assetId"
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
          )}

          {/* Síntoma o Descripción */}
          <div className="space-y-1">
            <Label htmlFor="symptom" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Síntoma o Descripción de la Falla *
            </Label>
            <Input
              id="symptom"
              className="w-full h-10 text-sm"
              placeholder="Ej: Fuga de aceite en cilindro hidráulico principal"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              required
            />
          </div>

          {/* Causa Raíz / Acción */}
          <div className="space-y-1">
            <Label htmlFor="rootCause" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Causa Raíz / Acción Correctiva Tomada
            </Label>
            <Textarea
              id="rootCause"
              rows={3}
              className="text-sm"
              placeholder="Ej: Desgaste de empacadura o sello retenedor. Se reemplazó por repuesto de stock."
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
            />
          </div>

          {/* Horas de Paro (Downtime) */}
          <div className="space-y-1">
            <Label htmlFor="downtimeHours" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Horas de Paro (Downtime) *
            </Label>
            <Input
              id="downtimeHours"
              type="number"
              step="0.1"
              min="0"
              className="w-full h-10 text-sm font-mono"
              value={downtimeHours}
              onChange={(e) => setDowntimeHours(e.target.value)}
              required
            />
          </div>

          {/* Fechas de Reporte y Resolución */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="reportedAt" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Fecha / Hora de Reporte *
              </Label>
              <Input
                id="reportedAt"
                type="datetime-local"
                className="w-full h-10 text-xs sm:text-sm"
                value={reportedAt}
                onChange={(e) => setReportedAt(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="resolvedAt" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Fecha / Hora Resuelto (Opcional)
              </Label>
              <Input
                id="resolvedAt"
                type="datetime-local"
                className="w-full h-10 text-xs sm:text-sm"
                value={resolvedAt}
                onChange={(e) => setResolvedAt(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
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
