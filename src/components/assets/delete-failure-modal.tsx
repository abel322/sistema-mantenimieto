'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { deleteFailureReport } from '@/app/actions/failures'

interface FailureLogDeleteTarget {
  id: string
  symptom: string
  downtimeHours?: number
}

interface DeleteFailureModalProps {
  isOpen: boolean
  failureLog: FailureLogDeleteTarget | null
  onClose: () => void
  onSuccess: () => void
}

export function DeleteFailureModal({
  isOpen,
  failureLog,
  onClose,
  onSuccess,
}: DeleteFailureModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !failureLog) return null

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)

    try {
      const res = await deleteFailureReport(failureLog.id)
      if (!res.success) {
        throw new Error(res.error || 'Error al eliminar la falla')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al procesar la solicitud.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />
            ¿Eliminar Registro de Falla?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">
            ¿Deseas eliminar este registro de falla? Esta acción corregirá el historial de paradas del activo.
          </p>

          <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-1">
            <p className="font-semibold text-foreground">"{failureLog.symptom}"</p>
            {failureLog.downtimeHours !== undefined && (
              <p className="text-muted-foreground font-mono">{failureLog.downtimeHours} horas de paro acumuladas</p>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="w-full sm:w-auto h-10"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full sm:w-auto h-10"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" /> Confirmar Eliminación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
