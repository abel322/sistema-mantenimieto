'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { PartEditModal } from '@/components/inventory/part-edit-modal'
import {
  AlertTriangle,
  Package,
  Pencil,
  Trash2,
  Plus,
  Minus,
  Eye,
  Loader2,
  AlertCircle,
  Truck
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Part {
  id: string
  name: string
  code: string
  category: string
  stock: number
  minStock: number
  unit: string
  price: number
  location?: string | null
  description?: string | null
  preferredSupplierId?: string | null
  preferredSupplier?: {
    id: string
    name: string
  } | null
}

export function InventoryList() {
  const router = useRouter()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Edit modal state
  const [editingPart, setEditingPart] = useState<Part | null>(null)

  // Delete modal state
  const [deletingPart, setDeletingPart] = useState<Part | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchParts = async () => {
    try {
      const res = await fetch('/api/inventory')
      if (res.ok) {
        const data = await res.json()
        setParts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParts()
  }, [])

  const handleStockAdjustment = async (partId: string, adjustment: number) => {
    setUpdatingId(partId)
    try {
      const res = await fetch(`/api/inventory/${partId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment }),
      })

      if (res.ok) {
        const updatedPart = await res.json()
        setParts((prev) =>
          prev.map((p) => (p.id === partId ? { ...p, stock: updatedPart.stock } : p))
        )
        router.refresh()
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingPart) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/inventory/${deletingPart.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setParts((prev) => prev.filter((p) => p.id !== deletingPart.id))
        setDeletingPart(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting part:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Cargando inventario de repuestos...</span>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {parts.map((part) => {
        const isLowStock = part.stock <= part.minStock
        const isOutOfStock = part.stock === 0

        return (
          <Card
            key={part.id}
            className={`hover:border-primary/40 transition-all h-full flex flex-col justify-between shadow-sm ${
              isOutOfStock
                ? 'border-destructive bg-destructive/5'
                : isLowStock
                ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                : ''
            }`}
          >
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/inventory/${part.id}`}>
                        <h3 className="font-semibold text-base hover:text-primary transition-colors truncate">
                          {part.name}
                        </h3>
                      </Link>
                      <p className="text-xs font-mono text-muted-foreground">
                        {part.code} • {part.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingPart(part)}
                      title="Editar Repuesto"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingPart(part)}
                      title="Eliminar Repuesto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* View details */}
                    <Link href={`/dashboard/inventory/${part.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Ver Detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Stock actual
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isLowStock && (
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            isOutOfStock ? 'text-destructive' : 'text-yellow-500'
                          }`}
                        />
                      )}
                      <Badge
                        variant={
                          isOutOfStock
                            ? 'destructive'
                            : isLowStock
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {part.stock} {part.unit}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Stock mínimo
                    </span>
                    <span className="font-mono">{part.minStock} {part.unit}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="text-muted-foreground">Precio Unitario</span>
                    <span className="font-semibold text-sm">
                      {formatCurrency(part.price)}
                    </span>
                  </div>

                  {part.preferredSupplier && (
                    <div className="flex items-center justify-between text-xs pt-1.5 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-primary shrink-0" />
                        Proveedor:
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[140px]" title={part.preferredSupplier.name}>
                        {part.preferredSupplier.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stock Controls (+ Entradas / - Salidas) */}
              <div className="pt-3 border-t flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Ajuste Rápido:
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                    disabled={part.stock <= 0 || updatingId === part.id}
                    onClick={() => handleStockAdjustment(part.id, -1)}
                    title="Registrar Salida de 1 Unidad"
                  >
                    <Minus className="w-3.5 h-3.5 mr-1" /> -1 Salida
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                    disabled={updatingId === part.id}
                    onClick={() => handleStockAdjustment(part.id, 1)}
                    title="Registrar Entrada de 1 Unidad"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> +1 Entrada
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {parts.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay repuestos registrados en el inventario
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingPart && (
        <PartEditModal
          isOpen={!!editingPart}
          part={editingPart}
          onClose={() => setEditingPart(null)}
          onSuccess={() => {
            fetchParts()
            router.refresh()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Repuesto?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de eliminar el repuesto <strong>"{deletingPart.name}" ({deletingPart.code})</strong> del inventario? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingPart(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
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
      )}
    </div>
  )
}
