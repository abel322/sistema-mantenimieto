'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ToolFormModal, ToolData } from './tool-form-modal'
import { ToolAssignModal } from './tool-assign-modal'
import { ToolReturnModal } from './tool-return-modal'
import {
  Wrench,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  UserCheck,
  ArrowLeftRight,
  ShieldAlert,
  Cpu,
  MapPin,
  Tag,
  Clock,
  CheckCircle2,
  Layers
} from 'lucide-react'

export interface ToolItem {
  id: string
  code: string
  name: string
  category: string
  type: 'FIXED_MACHINE' | 'FIXED_AREA' | 'PORTABLE'
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED'
  brand?: string | null
  serialNumber?: string | null
  assetId?: string | null
  asset?: {
    id: string
    name: string
    code: string
    area: string
  } | null
  area?: string | null
  assignedTo?: string | null
  assignedAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export function ToolsList() {
  const [tools, setTools] = useState<ToolItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<ToolData | null>(null)
  const [assigningTool, setAssigningTool] = useState<ToolItem | null>(null)
  const [returningTool, setReturningTool] = useState<ToolItem | null>(null)
  const [deletingTool, setDeletingTool] = useState<ToolItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTools = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)

      const res = await fetch(`/api/tools?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTools(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error loading tools:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [search, statusFilter, typeFilter])

  const handleDelete = async () => {
    if (!deletingTool) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tools/${deletingTool.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setTools((prev) => prev.filter((t) => t.id !== deletingTool.id))
        setDeletingTool(null)
      }
    } catch (err) {
      console.error('Error deleting tool:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusToggle = async (toolId: string, newStatus: ToolItem['status']) => {
    try {
      const res = await fetch(`/api/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchTools()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const renderStatusBadge = (tool: ToolItem) => {
    switch (tool.status) {
      case 'AVAILABLE':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium">
            🟢 Disponible
          </Badge>
        )
      case 'IN_USE':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium">
            🟡 En Uso
          </Badge>
        )
      case 'MAINTENANCE':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-medium">
            🔴 En Mantenimiento
          </Badge>
        )
      case 'RETIRED':
        return (
          <Badge variant="outline" className="text-muted-foreground border-muted">
            ⚪ Retirada
          </Badge>
        )
    }
  }

  const renderTypeInfo = (tool: ToolItem) => {
    switch (tool.type) {
      case 'FIXED_MACHINE':
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Fija en Máquina:</span>
            <strong className="text-foreground truncate">{tool.asset ? `${tool.asset.code} (${tool.asset.name})` : 'No asignada'}</strong>
          </div>
        )
      case 'FIXED_AREA':
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>Fija en Área:</span>
            <strong className="text-foreground truncate">{tool.area || 'Área no especificada'}</strong>
          </div>
        )
      case 'PORTABLE':
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Tipo:</span>
            <strong className="text-foreground">Portátil (Pañol Central)</strong>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nombre, categoría, marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Filters & Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[150px] text-xs"
          >
            <option value="ALL">Estado: Todos</option>
            <option value="AVAILABLE">🟢 Disponible</option>
            <option value="IN_USE">🟡 En Uso</option>
            <option value="MAINTENANCE">🔴 Mantenimiento</option>
            <option value="RETIRED">⚪ Retirada</option>
          </Select>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-[160px] text-xs"
          >
            <option value="ALL">Tipo: Todos</option>
            <option value="PORTABLE">🔧 Portátil</option>
            <option value="FIXED_MACHINE">⚙️ Fija en Máquina</option>
            <option value="FIXED_AREA">🏭 Fija en Área</option>
          </Select>

          {/* Create Button */}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Registrar Herramienta
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Cargando control de herramientas...</span>
        </div>
      ) : tools.length === 0 ? (
        <Card className="col-span-full border-dashed">
          <CardContent className="p-12 text-center space-y-3">
            <Wrench className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No se encontraron herramientas</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No hay herramientas registradas con los filtros actuales o la búsqueda.
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Registrar Primera Herramienta
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Tools Cards Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const formattedAssignedAt = tool.assignedAt
              ? new Date(tool.assignedAt).toLocaleString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : null

            return (
              <Card
                key={tool.id}
                className="hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm overflow-hidden"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate" title={tool.name}>
                            {tool.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-0.5">
                            <span className="font-bold text-foreground">{tool.code}</span>
                            <span>•</span>
                            <span>{tool.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">{renderStatusBadge(tool)}</div>
                    </div>

                    {/* Meta info block */}
                    <div className="space-y-2 pt-1 border-t border-border/60">
                      {/* Type info */}
                      {renderTypeInfo(tool)}

                      {/* Brand & Serial Number */}
                      {(tool.brand || tool.serialNumber) && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {tool.brand && (
                            <span>
                              Marca: <strong className="text-foreground">{tool.brand}</strong>
                            </span>
                          )}
                          {tool.serialNumber && (
                            <span className="font-mono text-[11px]">
                              S/N: {tool.serialNumber}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Assigned to info block */}
                      {tool.status === 'IN_USE' && tool.assignedTo && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-xs space-y-1 mt-2">
                          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-medium">
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              Asignado a:
                            </span>
                          </div>
                          <p className="font-semibold text-foreground truncate pl-5">
                            {tool.assignedTo}
                          </p>
                          {formattedAssignedAt && (
                            <p className="text-[11px] text-muted-foreground pl-5 flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              Prestado: {formattedAssignedAt}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Fixed machine / area location callout */}
                      {tool.status === 'IN_USE' && !tool.assignedTo && (
                        <div className="p-2 rounded-lg bg-muted text-xs text-muted-foreground">
                          <span>Ubicación actual: </span>
                          <strong className="text-foreground">
                            {tool.asset ? tool.asset.name : tool.area || 'En uso operativo'}
                          </strong>
                        </div>
                      )}

                      {/* Notes if available */}
                      {tool.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic pt-1">
                          "{tool.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t flex items-center justify-between gap-2">
                    {/* Action buttons (Assign / Return / Maintenance) */}
                    <div className="flex items-center gap-1.5">
                      {tool.status === 'AVAILABLE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          onClick={() => setAssigningTool(tool)}
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" /> Prestar / Asignar
                        </Button>
                      )}

                      {tool.status === 'IN_USE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"
                          onClick={() => setReturningTool(tool)}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Devolver a Pañol
                        </Button>
                      )}

                      {tool.status === 'MAINTENANCE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          onClick={() => handleStatusToggle(tool.id, 'AVAILABLE')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Habilitar
                        </Button>
                      )}

                      {/* Toggle Maintenance option */}
                      {tool.status !== 'MAINTENANCE' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                          title="Enviar a Mantenimiento/Calibración"
                          onClick={() => handleStatusToggle(tool.id, 'MAINTENANCE')}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingTool(tool)}
                        title="Editar Herramienta"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingTool(tool)}
                        title="Eliminar Herramienta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingTool) && (
        <ToolFormModal
          isOpen={isCreateModalOpen || !!editingTool}
          tool={editingTool}
          onClose={() => {
            setIsCreateModalOpen(false)
            setEditingTool(null)
          }}
          onSuccess={() => fetchTools()}
        />
      )}

      {/* Assign Modal */}
      {assigningTool && (
        <ToolAssignModal
          isOpen={!!assigningTool}
          tool={assigningTool}
          onClose={() => setAssigningTool(null)}
          onSuccess={() => fetchTools()}
        />
      )}

      {/* Return Modal */}
      {returningTool && (
        <ToolReturnModal
          isOpen={!!returningTool}
          tool={returningTool}
          onClose={() => setReturningTool(null)}
          onSuccess={() => fetchTools()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Herramienta?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de eliminar la herramienta <strong>"{deletingTool.name}" ({deletingTool.code})</strong>? Esta acción borrará el registro de inventario.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeletingTool(null)} disabled={deleting}>
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
      )}
    </div>
  )
}
