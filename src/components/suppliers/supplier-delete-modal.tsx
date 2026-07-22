'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { SupplierData } from './supplier-modal'

interface SupplierDeleteModalProps {
  isOpen: boolean
  supplier: SupplierData | null
  onClose: () => void
  onSuccess: () => void
}

export function SupplierDeleteModal({
  isOpen,
  supplier,
  onClose,
  onSuccess,
}: SupplierDeleteModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !supplier) return null

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar el proveedor')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al eliminar el proveedor.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">¿Eliminar Proveedor?</h3>
        </div>

        {error && (
          <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          ¿Estás seguro de eliminar al proveedor <strong>"{supplier.name}"</strong>?
          Se desvinculará de repuestos y órdenes de trabajo donde haya estado asignado. Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
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
  )
}
