'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2, ArrowLeftRight, CheckCircle2, User, Calendar } from 'lucide-react'

interface ToolReturnModalProps {
  isOpen: boolean
  tool: {
    id: string
    code: string
    name: string
    assignedTo?: string | null
    assignedAt?: string | Date | null
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function ToolReturnModal({ isOpen, tool, onClose, onSuccess }: ToolReturnModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !tool) return null

  const handleReturn = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RETURN',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al devolver la herramienta')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = tool.assignedAt
    ? new Date(tool.assignedAt).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-green-500/10 dark:bg-green-500/20">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <ArrowLeftRight className="w-5 h-5" />
            <h2 className="text-lg font-bold">Devolver a Taller / Pañol</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            ¿Confirmas la recepción y devolución de esta herramienta al Pañol Central? Su estado cambiará inmediatamente a <strong>🟢 Disponible</strong>.
          </p>

          <div className="p-4 bg-muted/50 border rounded-lg space-y-2 text-xs">
            <div className="font-semibold text-sm text-foreground">
              {tool.name} <span className="font-mono text-xs text-muted-foreground">({tool.code})</span>
            </div>

            {tool.assignedTo && (
              <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
                <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Actualmente retenida por: <strong className="text-foreground">{tool.assignedTo}</strong></span>
              </div>
            )}

            {formattedDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Fecha de préstamo: <strong>{formattedDate}</strong></span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-lg">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleReturn}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirmar Devolución
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
