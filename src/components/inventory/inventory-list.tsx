'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
  Truck,
  Search,
  Filter,
  Cpu
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AssetOption {
  id: string
  name: string
  code: string
}

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
  assets?: AssetOption[]
}

export function InventoryList() {
  const router = useRouter()
  const [parts, setParts] = useState<Part[]>([])
  const [assetsList, setAssetsList] = useState<AssetOption[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [assetFilter, setAssetFilter] = useState('ALL')

  // Edit modal state
  const [editingPart, setEditingPart] = useState<Part | null>(null)

  // Delete modal state
  const [deletingPart, setDeletingPart] = useState<Part | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchParts = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (assetFilter !== 'ALL') query.set('assetId', assetFilter)
      if (categoryFilter !== 'ALL') query.set('category', categoryFilter)
      if (search.trim()) query.set('search', search.trim())

      const res = await fetch(`/api/inventory?${query.toString()}`)
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
    fetch('/api/assets')
      .then((res) => res.json())
      .then((data) => setAssetsList(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchParts()
  }, [assetFilter, categoryFilter, search])

  const categories = useMemo(() => {
    const set = new Set<string>()
    parts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [parts])

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

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Search and Filters Bar */}
      <Card className="shadow-sm w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por repuesto, código SKU o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full text-sm"
              />
            </div>

            {/* Filter by Machine / Asset */}
            <div className="w-full sm:w-60 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary shrink-0 hidden sm:inline-block" />
              <Select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium"
              >
                <option value="ALL">Todas las Máquinas</option>
                {assetsList.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Filter by Category */}
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs sm:text-sm"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Spare Parts */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Cargando inventario de repuestos...</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-full">
          {parts.map((part) => {
            const isLowStock = part.stock <= part.minStock
            const isOutOfStock = part.stock === 0

            return (
              <Card
                key={part.id}
                className={`w-full max-w-full overflow-hidden hover:border-primary/40 transition-all h-full flex flex-col justify-between shadow-sm ${
                  isOutOfStock
                    ? 'border-destructive bg-destructive/5'
                    : isLowStock
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                    : ''
                }`}
              >
                <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/dashboard/inventory/${part.id}`}>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug break-words hover:text-primary transition-colors">
                              {part.name}
                            </h3>
                          </Link>
                          <p className="text-xs font-mono text-muted-foreground break-words pt-0.5">
                            {part.code} • {part.category || 'General'}
                          </p>
                          {part.description && (
                            <p className="text-xs text-muted-foreground break-words whitespace-normal pt-1.5 leading-relaxed">
                              {part.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                          onClick={() => setEditingPart(part)}
                          title="Editar Repuesto"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
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
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                            title="Ver Detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">
                          Stock actual
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isLowStock && (
                            <AlertTriangle
                              className={`h-4 w-4 shrink-0 ${
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

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-muted-foreground">Precio Unitario</span>
                        <span className="font-semibold text-sm">
                          {formatCurrency(part.price)}
                        </span>
                      </div>

                      {/* Associated Assets / Machines Badges */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                          <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Aplica a:</span>
                        </div>
                        {part.assets && part.assets.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {part.assets.map((asset) => (
                              <Link key={asset.id} href={`/dashboard/assets/${asset.id}`}>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] py-0.5 px-2 hover:bg-primary/20 transition-colors cursor-pointer break-words whitespace-normal"
                                  title={`Ver activo: ${asset.name}`}
                                >
                                  {asset.name}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] italic text-muted-foreground">
                            Uso General / Sin máquina asignada
                          </span>
                        )}
                      </div>

                      {part.preferredSupplier && (
                        <div className="flex items-center justify-between text-xs pt-1.5 text-muted-foreground">
                          <span className="flex items-center gap-1 shrink-0">
                            <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                            Proveedor:
                          </span>
                          <span className="font-medium text-foreground break-words text-right" title={part.preferredSupplier.name}>
                            {part.preferredSupplier.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Stock Controls (+ Entradas / - Salidas) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Ajuste Rápido:
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-initial h-8 text-xs bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-400 border-red-200 dark:border-red-900/50"
                        disabled={part.stock <= 0 || updatingId === part.id}
                        onClick={() => handleStockAdjustment(part.id, -1)}
                        title="Registrar Salida de 1 Unidad"
                      >
                        <Minus className="w-3.5 h-3.5 mr-1" /> -1 Salida
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-initial h-8 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
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
        </div>
      )}

      {parts.length === 0 && !loading && (
        <Card className="col-span-full">
          <CardContent className="p-12 text-center space-y-2">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-base font-semibold text-muted-foreground">
              No se encontraron repuestos en el inventario
            </p>
            <p className="text-xs text-muted-foreground">
              Intenta cambiar la búsqueda o el filtro de máquina asignada.
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
