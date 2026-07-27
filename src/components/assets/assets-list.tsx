'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AssetEditModal } from './asset-edit-modal'
import { AssetDeleteModal } from './asset-delete-modal'
import { Toast, ToastMessage } from '@/components/ui/toast'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Wrench,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Plus,
  PackageX,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAreaLabel, getCriticalityBadge, PLANT_AREAS } from '@/lib/constants'

export interface AssetWithCounts {
  id: string
  name: string
  code: string
  area: string
  criticality: number
  description?: string | null
  imageUrl?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  _count?: {
    workOrders: number
    failureLogs: number
  }
}

interface AssetsListProps {
  initialAssets?: AssetWithCounts[]
}

type ViewMode = 'auto' | 'table' | 'grid'

export function AssetsList({ initialAssets }: AssetsListProps) {
  const router = useRouter()
  const [assets, setAssets] = useState<AssetWithCounts[]>(initialAssets || [])
  const [loading, setLoading] = useState(!initialAssets)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // Filter and view states
  const [searchTerm, setSearchTerm] = useState('')
  const [areaFilter, setAreaFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('auto')

  // Modals state
  const [editingAsset, setEditingAsset] = useState<AssetWithCounts | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<AssetWithCounts | null>(null)

  // Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const menuRef = useRef<HTMLDivElement | null>(null)

  // Fetch assets from API
  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setAssets(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialAssets) {
      fetchAssets()
    }
  }, [initialAssets])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEditSuccess = () => {
    setToast({
      id: Date.now().toString(),
      title: 'Activo actualizado',
      description: 'Los cambios fueron guardados exitosamente.',
      type: 'success',
    })
    fetchAssets()
    router.refresh()
  }

  const handleDeleteSuccess = (deletedName: string) => {
    setToast({
      id: Date.now().toString(),
      title: 'Activo eliminado',
      description: `El activo "${deletedName}" fue eliminado del sistema.`,
      type: 'success',
    })
    fetchAssets()
    router.refresh()
  }

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesArea = areaFilter === 'ALL' || asset.area === areaFilter

    return matchesSearch && matchesArea
  })

  // Criticality Badge Renderer
  const renderCriticalityBadge = (criticality: number | string) => {
    const badgeInfo = getCriticalityBadge(criticality)
    return <Badge className={badgeInfo.className}>{badgeInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Cargando activos de la planta...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Toolbar: Search, Filters & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tag, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm h-9"
            />
          </div>

          {/* Area Filter */}
          <div className="relative min-w-[180px]">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground"
            >
              <option value="ALL">Todas las áreas</option>
              {PLANT_AREAS.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher Button Group */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
          <span className="text-xs text-muted-foreground font-medium hidden lg:inline">
            {filteredAssets.length} activo{filteredAssets.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center bg-muted/60 p-1 rounded-md border border-border/50">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${viewMode === 'grid' ? 'bg-background shadow-xs font-semibold' : 'text-muted-foreground'}`}
              title="Vista de Tarjetas (Grid)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Tarjetas</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${viewMode === 'table' ? 'bg-background shadow-xs font-semibold' : 'text-muted-foreground'}`}
              title="Vista de Tabla"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Tabla</span>
            </Button>
            <Button
              variant={viewMode === 'auto' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('auto')}
              className={`h-7 px-2.5 text-xs ${viewMode === 'auto' ? 'bg-background shadow-xs font-semibold text-primary' : 'text-muted-foreground'}`}
              title="Modo Automático (Tabla en PC, Tarjetas en Móvil)"
            >
              Auto
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div className="border border-dashed rounded-xl p-12 text-center space-y-3 bg-card/50">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <PackageX className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base">No se encontraron activos</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchTerm || areaFilter !== 'ALL'
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Aún no hay activos registrados en la planta. Crea el primero ahora.'}
            </p>
          </div>
          {!(searchTerm || areaFilter !== 'ALL') && (
            <Link href="/dashboard/assets/new">
              <Button size="sm" className="mt-2">
                <Plus className="w-4 h-4 mr-1.5" />
                Nuevo Activo
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Modern High-Density Desktop Data Table */}
      {filteredAssets.length > 0 && (
        <div
          className={`border rounded-lg bg-card shadow-xs overflow-hidden ${
            viewMode === 'table'
              ? 'block'
              : viewMode === 'grid'
              ? 'hidden'
              : 'hidden md:block'
          }`}
        >
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider">Código / TAG</TableHead>
                <TableHead className="min-w-[200px] font-semibold text-xs uppercase tracking-wider">Nombre del Activo</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Área / Tipo</TableHead>
                <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider">Criticidad</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Métricas Operativas</TableHead>
                <TableHead className="w-[100px] font-semibold text-xs uppercase tracking-wider">Estatus</TableHead>
                <TableHead className="w-[140px] text-right font-semibold text-xs uppercase tracking-wider">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const isMenuOpen = openMenuId === asset.id

                return (
                  <TableRow
                    key={asset.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Código / TAG */}
                    <TableCell className="font-mono text-xs">
                      <span className="font-bold bg-muted/80 border border-border/60 text-foreground px-2 py-1 rounded text-xs inline-block tracking-wider">
                        {asset.code}
                      </span>
                    </TableCell>

                    {/* Nombre del Activo + Subtexto */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/dashboard/assets/${asset.id}`}
                          className="font-semibold text-sm hover:text-primary transition-colors block text-foreground group-hover:text-primary"
                        >
                          {asset.name}
                        </Link>
                        {asset.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-1" title={asset.description}>
                            {asset.description}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 italic">Sin descripción</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Área / Tipo */}
                    <TableCell>
                      <span className="text-xs font-medium text-foreground/80 bg-muted px-2.5 py-1 rounded-md border border-border/40 inline-block">
                        {getAreaLabel(asset.area)}
                      </span>
                    </TableCell>

                    {/* Criticidad */}
                    <TableCell>{renderCriticalityBadge(asset.criticality)}</TableCell>

                    {/* Métricas Operativas */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-200/60 dark:border-blue-800/50" title="Órdenes de Trabajo Abiertas">
                          <Wrench className="w-3.5 h-3.5" />
                          {asset._count?.workOrders ?? 0} OT
                        </span>
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded text-xs font-medium border border-amber-200/60 dark:border-amber-800/50" title="Fallas Reportadas">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {asset._count?.failureLogs ?? 0} Fallas
                        </span>
                      </div>
                    </TableCell>

                    {/* Estatus */}
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Activo</span>
                      </div>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/dashboard/assets/${asset.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <span>Ver Detalle</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>

                        {/* Dropdown Menu */}
                        <div className="relative" ref={isMenuOpen ? menuRef : null}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setOpenMenuId(isMenuOpen ? null : asset.id)
                            }}
                            aria-label="Opciones de activo"
                            title="Opciones"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {isMenuOpen && (
                            <div
                              className="absolute right-0 top-9 w-44 bg-popover border border-border rounded-md shadow-lg py-1 z-30 animate-in fade-in-50 zoom-in-95 text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  setEditingAsset(asset)
                                }}
                              >
                                <Pencil className="w-4 h-4 text-blue-500" />
                                <span>Editar Activo</span>
                              </button>

                              <button
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors border-t border-border/50 mt-1 pt-2"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  setDeletingAsset(asset)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Eliminar Activo</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile Card Grid View (< 768px in auto mode, or forced grid mode) */}
      {filteredAssets.length > 0 && (
        <div
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
            viewMode === 'grid'
              ? 'grid'
              : viewMode === 'table'
              ? 'hidden'
              : 'block md:hidden'
          }`}
        >
          {filteredAssets.map((asset) => {
            const isMenuOpen = openMenuId === asset.id

            return (
              <Card
                key={asset.id}
                className="hover:border-primary/40 transition-all cursor-pointer h-full relative group shadow-xs hover:shadow-md"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    {/* Top bar with Name, Code, Badge and Action Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/assets/${asset.id}`}
                          className="hover:text-primary transition-colors block"
                        >
                          <h3 className="text-base font-semibold truncate group-hover:text-primary transition-colors">
                            {asset.name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50 inline-block mt-0.5">
                            {asset.code}
                          </span>
                        </Link>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {renderCriticalityBadge(asset.criticality)}

                        {/* Card Action Menu Button */}
                        <div className="relative" ref={isMenuOpen ? menuRef : null}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setOpenMenuId(isMenuOpen ? null : asset.id)
                            }}
                            aria-label="Opciones de activo"
                            title="Opciones"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 top-9 w-44 bg-popover border border-border rounded-md shadow-lg py-1 z-30 animate-in fade-in-50 zoom-in-95"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  setEditingAsset(asset)
                                }}
                              >
                                <Pencil className="w-4 h-4 text-blue-500" />
                                <span>Editar Activo</span>
                              </button>

                              <button
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors border-t border-border/50 mt-1 pt-2"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  setDeletingAsset(asset)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Eliminar Activo</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area linking to detail page */}
                    <Link href={`/dashboard/assets/${asset.id}`} className="block space-y-2">
                      <div className="text-xs space-y-1">
                        <p>
                          <span className="text-muted-foreground">Área:</span>{' '}
                          <strong className="font-medium text-foreground">
                            {getAreaLabel(asset.area)}
                          </strong>
                        </p>
                        {asset.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                            {asset.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Footer section with count badges & view link */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded font-medium border border-blue-200/50 dark:border-blue-800/50">
                        <Wrench className="w-3.5 h-3.5" />
                        {asset._count?.workOrders ?? 0} OT
                      </span>
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded font-medium border border-amber-200/50 dark:border-amber-800/50">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        {asset._count?.failureLogs ?? 0} Fallas
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/assets/${asset.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Ver Detalle</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Asset Modal */}
      {deletingAsset && (
        <AssetDeleteModal
          asset={deletingAsset}
          isOpen={!!deletingAsset}
          onClose={() => setDeletingAsset(null)}
          onSuccess={() => handleDeleteSuccess(deletingAsset.name)}
        />
      )}
    </div>
  )
}
