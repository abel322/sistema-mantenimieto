'use client'

import { useState, useEffect } from 'react'
import { ChecklistExecution, ExecutionStatus } from '@/types/checklists'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { updateChecklistExecution } from '@/app/actions/checklists'
import { X, Save, Loader2, CheckCircle, AlertTriangle, XCircle, Package } from 'lucide-react'

interface EditInspectionModalProps {
  execution: ChecklistExecution | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function EditInspectionModal({
  execution,
  isOpen,
  onClose,
  onSuccess,
}: EditInspectionModalProps) {
  const [status, setStatus] = useState<ExecutionStatus>('PASSED')
  const [notes, setNotes] = useState('')
  const [responsesState, setResponsesState] = useState<
    {
      id: string
      itemId?: string
      label: string
      type: string
      valueBoolean: boolean | null
      valueNumeric: string
      valueText: string
      notes: string
    }[]
  >([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && execution) {
      setStatus(execution.status as ExecutionStatus)
      setNotes(execution.notes || '')
      setError(null)

      if (execution.responses && execution.responses.length > 0) {
        setResponsesState(
          execution.responses.map((resp) => ({
            id: resp.id,
            itemId: resp.itemId,
            label: resp.item?.label || 'Parámetro',
            type: resp.item?.type || 'BOOLEAN',
            valueBoolean: resp.valueBoolean ?? true,
            valueNumeric: resp.valueNumeric !== null && resp.valueNumeric !== undefined ? String(resp.valueNumeric) : '',
            valueText: resp.valueText || '',
            notes: resp.notes || '',
          }))
        )
      } else {
        setResponsesState([])
      }
    }
  }, [isOpen, execution])

  if (!isOpen || !execution) return null

  const handleResponseBooleanToggle = (id: string, val: boolean) => {
    setResponsesState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, valueBoolean: val } : r))
    )
  }

  const handleResponseNumericChange = (id: string, val: string) => {
    setResponsesState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, valueNumeric: val } : r))
    )
  }

  const handleResponseTextChange = (id: string, val: string) => {
    setResponsesState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, valueText: val } : r))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payloadResponses = responsesState.map((r) => ({
        id: r.id,
        itemId: r.itemId,
        valueBoolean: r.valueBoolean,
        valueNumeric: r.valueNumeric !== '' ? parseFloat(r.valueNumeric) : null,
        valueText: r.valueText,
        notes: r.notes,
        isFlagged: r.type === 'BOOLEAN' ? !r.valueBoolean : false,
      }))

      // Try Server Action first
      const res = await updateChecklistExecution(execution.id, {
        status,
        notes,
        responses: payloadResponses,
      })

      if (res.success) {
        onSuccess(res.message || 'Registro de inspección actualizado.')
        onClose()
      } else {
        // Fallback to API endpoint
        const apiRes = await fetch(`/api/checklists/executions/${execution.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            notes,
            responses: payloadResponses,
          }),
        })

        if (!apiRes.ok) {
          const errData = await apiRes.json()
          throw new Error(errData.error || 'Error al actualizar la inspección')
        }

        onSuccess('Registro de inspección actualizado.')
        onClose()
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar los cambios de la inspección.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40 shrink-0">
          <div>
            <h3 className="text-lg font-bold">Editar Registro de Inspección</h3>
            <p className="text-xs text-muted-foreground">
              {execution.template?.title || 'Inspección'} • {execution.asset?.name} ({execution.asset?.code})
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Status & Asset Quick Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-card border shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="statusSelect" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Estado de la Inspección
              </Label>
              <Select
                id="statusSelect"
                value={status}
                onChange={(e) => setStatus(e.target.value as ExecutionStatus)}
              >
                <option value="PASSED">🟢 Conforme (PASSED)</option>
                <option value="FLAGGED">🟡 Observado (FLAGGED)</option>
                <option value="FAILED">🔴 No Conforme (FAILED)</option>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Activo Inspeccionado
              </span>
              <p className="font-bold text-sm text-foreground">
                {execution.asset?.name} ({execution.asset?.code})
              </p>
              <p className="text-xs text-muted-foreground">Técnico: {execution.technician?.name}</p>
            </div>
          </div>

          {/* Evaluated Items Editor */}
          {responsesState.length > 0 && (
            <div className="space-y-3">
              <Label className="font-bold text-sm block">Edición de Parámetros Evaluados:</Label>
              <div className="border rounded-xl divide-y max-h-[220px] overflow-y-auto bg-card">
                {responsesState.map((resp, index) => (
                  <div key={resp.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        #{index + 1}. {resp.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {resp.type === 'BOOLEAN' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant={resp.valueBoolean ? 'default' : 'outline'}
                            className={`h-8 text-xs font-bold ${
                              resp.valueBoolean ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                            }`}
                            onClick={() => handleResponseBooleanToggle(resp.id, true)}
                          >
                            OK
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={!resp.valueBoolean ? 'destructive' : 'outline'}
                            className="h-8 text-xs font-bold"
                            onClick={() => handleResponseBooleanToggle(resp.id, false)}
                          >
                            NO OK
                          </Button>
                        </div>
                      )}

                      {resp.type === 'NUMERIC' && (
                        <Input
                          type="number"
                          step="any"
                          value={resp.valueNumeric}
                          onChange={(e) => handleResponseNumericChange(resp.id, e.target.value)}
                          className="w-28 h-8 text-xs font-mono text-center"
                          placeholder="Valor"
                        />
                      )}

                      {resp.type === 'TEXT' && (
                        <Input
                          type="text"
                          value={resp.valueText}
                          onChange={(e) => handleResponseTextChange(resp.id, e.target.value)}
                          className="w-44 h-8 text-xs"
                          placeholder="Observación..."
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspector Notes */}
          <div className="space-y-2">
            <Label htmlFor="execNotes" className="font-semibold text-sm">
              Observaciones Generales del Inspector
            </Label>
            <Textarea
              id="execNotes"
              rows={3}
              placeholder="Notas generales, comentarios de estado o recomendaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="border-t pt-4 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="shadow-md">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Actualizar Inspección
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
