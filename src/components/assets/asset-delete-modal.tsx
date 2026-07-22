'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'

interface AssetDeleteModalProps {
  isOpen: boolean
  asset: {
    id: string
    name: string
    code: string
  }
  onClose: () => void
  onSuccess: (deletedAssetName: string) => void
}

export function AssetDeleteModal({
  isOpen,
  asset,
  onClose,
  onSuccess,
}: AssetDeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleDelete() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el activo')
      }

      onSuccess(asset.name)
      onClose()
    } catch (err: any) {
      console.error('Error deleting asset:', err)
      setError(err.message || 'Ocurrió un error al eliminar el activo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-destructive">
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertCircle className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Eliminar Activo</h3>
            <p className="text-xs text-muted-foreground font-mono">{asset.code}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-950/50 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            ¿Estás seguro de que deseas eliminar el activo{' '}
            <strong className="text-foreground">"{asset.name}"</strong>?
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
            Esta acción no se puede deshacer y desvinculará sus registros asociados.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Confirmar Eliminación
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
