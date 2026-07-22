'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, AlertTriangle, Save, Loader2 } from 'lucide-react'

interface FailureLogModalProps {
  assetId: string
  assetName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function FailureLogModal({
  assetId,
  assetName,
  isOpen,
  onClose,
  onSuccess,
}: FailureLogModalProps) {
  const [symptom, setSymptom] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [downtimeHours, setDowntimeHours] = useState('1.5')
  const [reportedAt, setReportedAt] = useState(
    new Date().toISOString().slice(0, 16)
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symptom.trim()) {
      setError('El síntoma de la falla es obligatorio.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/assets/${assetId}/failures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptom,
          rootCause,
          downtimeHours: parseFloat(downtimeHours) || 0,
          reportedAt,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al registrar la falla')
      }

      // Reset form
      setSymptom('')
      setRootCause('')
      setDowntimeHours('1.5')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al registrar la falla.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-bold">Registrar Falla / Evento de Paro</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Activo Afectado:</span>
            <p className="font-bold text-sm">{assetName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptom" className="font-semibold text-sm">
              Síntoma / Descripción de la Falla *
            </Label>
            <Input
              id="symptom"
              placeholder="Ej. Fuga de aceite en caja reductora / Vibración excesiva"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rootCause" className="font-semibold text-sm">
              Causa Raíz / Acción Realizada (Opcional)
            </Label>
            <Textarea
              id="rootCause"
              placeholder="Ej. Desgaste en retén de aceite / Cambio de empacadura..."
              rows={3}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="downtimeHours" className="font-semibold text-sm">
                Horas de Paro (Downtime) *
              </Label>
              <Input
                id="downtimeHours"
                type="number"
                step="0.1"
                min="0"
                placeholder="1.5"
                value={downtimeHours}
                onChange={(e) => setDowntimeHours(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportedAt" className="font-semibold text-sm">
                Fecha / Hora del Evento *
              </Label>
              <Input
                id="reportedAt"
                type="datetime-local"
                value={reportedAt}
                onChange={(e) => setReportedAt(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Registrar Falla
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
