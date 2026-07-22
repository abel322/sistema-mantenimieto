'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAreaLabel } from '@/lib/constants'

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

const criticalityColors = {
  1: 'secondary',
  2: 'warning',
  3: 'destructive',
} as const

interface AssetsListProps {
  initialAssets?: AssetWithCounts[]
}

export function AssetsList({ initialAssets }: AssetsListProps) {
  const router = useRouter()
  const [assets, setAssets] = useState<AssetWithCounts[]>(initialAssets || [])
  const [loading, setLoading] = useState(!initialAssets)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => {
          const isMenuOpen = openMenuId === asset.id

          return (
            <Card
              key={asset.id}
              className="hover:border-primary/40 transition-all cursor-pointer h-full relative group shadow-sm hover:shadow-md"
            >
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  {/* Top bar with Name, Code, Badge and Action Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/assets/${asset.id}`}
                        className="hover:text-primary transition-colors block"
                      >
                        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                          {asset.name}
                        </h3>
                        <p className="text-sm font-mono text-muted-foreground">
                          {asset.code}
                        </p>
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={criticalityColors[asset.criticality as 1 | 2 | 3] || 'secondary'}>
                        Criticidad {asset.criticality}
                      </Badge>

                      {/* Card Action Menu Button (Three dots) */}
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
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Área:</span>{' '}
                        <strong className="font-medium">
                          {getAreaLabel(asset.area)}
                        </strong>
                      </p>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 pt-0.5">
                          {asset.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Footer section with count badges & view link */}
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <Wrench className="w-3.5 h-3.5" />
                      {asset._count?.workOrders ?? 0} OT
                    </span>
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      {asset._count?.failureLogs ?? 0} Fallas
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/assets/${asset.id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver Detalle <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {assets.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center space-y-3">
              <p className="text-muted-foreground text-base">
                No hay activos registrados en la planta.
              </p>
              <Link href="/dashboard/assets/new">
                <Button size="sm">Registrar Primer Activo</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <AssetEditModal
          isOpen={Boolean(editingAsset)}
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <AssetDeleteModal
          isOpen={Boolean(deletingAsset)}
          asset={deletingAsset}
          onClose={() => setDeletingAsset(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
