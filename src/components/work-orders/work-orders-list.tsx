'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/utils'
import { WorkOrderEditModal } from '@/components/work-orders/work-order-edit-modal'
import { Toast, ToastMessage } from '@/components/ui/toast'
import { updateWorkOrderStatus } from '@/app/actions/work-orders'
import {
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
  Search,
  Filter,
  Calendar,
  Zap,
  History,
  FileText,
  XCircle,
  X,
  PackageCheck
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WorkOrder {
  id: string
  title: string
  description?: string | null
  assetId: string
  priority: string
  type: string
  technicianId: string
  status: string
  createdAt: string
  closedAt?: string | null
  completedAt?: string | null
  laborHours?: number | null
  externalVendorId?: string | null
  guidelineId?: string | null
  asset: { id: string; name: string; code: string }
  technician: { id: string; name: string; role: string }
  externalVendor?: { id: string; name: string; category: string } | null
  materials?: {
    id?: string
    inventoryItemId?: string | null
    customName?: string | null
    isCustom?: boolean
    quantityUsed: number
    inventoryItem?: {
      id?: string
      name: string
      unit: string
      stock: number
    } | null
  }[]
  tools?: {
    id?: string
    toolId?: string | null
    customName?: string | null
    isCustom?: boolean
    tool?: {
      id: string
      code?: string
      name: string
      category?: string
    } | null
  }[]
}

const statusColors: Record<string, any> = {
  OPEN: 'default',
  ABIERTA: 'default',
  IN_PROGRESS: 'warning',
  EN_PROCESO: 'warning',
  ON_HOLD: 'secondary',
  PAUSADA: 'secondary',
  PENDIENTE_REPUESTO: 'outline',
  CLOSED: 'success',
  FINALIZADA: 'success',
  CANCELADA: 'destructive',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Abierta',
  ABIERTA: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  EN_PROCESO: 'En Progreso',
  ON_HOLD: 'En Pausa',
  PAUSADA: 'Pausada',
  PENDIENTE_REPUESTO: 'Pendiente Repuesto',
  CLOSED: 'Finalizada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

const typeLabels: Record<string, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
}

const priorityColors: Record<string, any> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'destructive',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

function isCompletedStatus(status: string): boolean {
  return ['FINALIZADA', 'CANCELADA', 'CLOSED'].includes(status)
}

export function WorkOrdersList() {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Active vs History tab selection
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // History tab filters
  const [searchQuery, setSearchQuery] = useState('')
  const [assetFilter, setAssetFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Edit modal state
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null)

  // Delete modal state
  const [deletingOrder, setDeletingOrder] = useState<WorkOrder | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/work-orders')
      if (res.ok) {
        const data = await res.json()
        setWorkOrders(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching work orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      // Execute Server Action
      const result = await updateWorkOrderStatus(orderId, newStatus)
      if (result.success) {
        const isFinalizing = ['FINALIZADA', 'CLOSED'].includes(newStatus)
        if (isFinalizing) {
          setToast({
            id: Date.now().toString(),
            title: 'Orden Finalizada',
            description: 'Orden finalizada y trasladada al historial.',
            type: 'success',
          })
        } else {
          setToast({
            id: Date.now().toString(),
            title: 'Estado Actualizado',
            description: result.message || 'Estado actualizado exitosamente.',
            type: 'info',
          })
        }
        await fetchOrders()
        router.refresh()
      } else {
        setToast({
          id: Date.now().toString(),
          title: 'Error',
          description: result.error || 'No se pudo actualizar el estado.',
          type: 'error',
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setToast({
        id: Date.now().toString(),
        title: 'Error de Red',
        description: 'Ocurrió un error al actualizar la orden.',
        type: 'error',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingOrder) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/work-orders/${deletingOrder.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setWorkOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id))
        setDeletingOrder(null)
        setToast({
          id: Date.now().toString(),
          title: 'Orden Eliminada',
          description: 'La orden de trabajo se ha eliminado correctamente.',
          type: 'info',
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting order:', error)
    } finally {
      setDeleting(false)
    }
  }

  // Active vs History partitions
  const activeOrders = useMemo(() => {
    return workOrders.filter((o) => !isCompletedStatus(o.status))
  }, [workOrders])

  const historyOrders = useMemo(() => {
    return workOrders.filter((o) => isCompletedStatus(o.status))
  }, [workOrders])

  // Unique assets list for history filter dropdown
  const uniqueAssets = useMemo(() => {
    const assetsMap = new Map<string, { id: string; name: string; code: string }>()
    workOrders.forEach((o) => {
      if (o.asset) {
        assetsMap.set(o.asset.id, o.asset)
      }
    })
    return Array.from(assetsMap.values())
  }, [workOrders])

  // Filtered history list based on search query, asset filter, date range
  const filteredHistoryOrders = useMemo(() => {
    return historyOrders.filter((order) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesTitle = order.title.toLowerCase().includes(q)
        const matchesDesc = order.description?.toLowerCase().includes(q)
        const matchesAsset = order.asset?.name.toLowerCase().includes(q) || order.asset?.code.toLowerCase().includes(q)
        const matchesTech = order.technician?.name.toLowerCase().includes(q)
        const matchesId = order.id.toLowerCase().includes(q)
        if (!matchesTitle && !matchesDesc && !matchesAsset && !matchesTech && !matchesId) {
          return false
        }
      }

      // Asset filter
      if (assetFilter !== 'ALL' && order.assetId !== assetFilter) {
        return false
      }

      // Date range filter (using completedAt, closedAt or createdAt)
      const orderDateStr = order.completedAt || order.closedAt || order.createdAt
      if (startDate) {
        const start = new Date(startDate)
        if (new Date(orderDateStr) < start) return false
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59')
        if (new Date(orderDateStr) > end) return false
      }

      return true
    })
  }, [historyOrders, searchQuery, assetFilter, startDate, endDate])

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Cargando órdenes de trabajo...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Tabbed Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border">
          <Button
            variant={activeTab === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('active')}
            className="gap-2 font-semibold shadow-none transition-all"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <span>Órdenes Activas</span>
            <Badge variant={activeTab === 'active' ? 'secondary' : 'outline'} className="ml-1 text-xs px-2 py-0.5">
              {activeOrders.length}
            </Badge>
          </Button>

          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="gap-2 font-semibold shadow-none transition-all"
          >
            <History className="w-4 h-4 text-blue-500" />
            <span>Historial / Finalizadas</span>
            <Badge variant={activeTab === 'history' ? 'secondary' : 'outline'} className="ml-1 text-xs px-2 py-0.5">
              {historyOrders.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* TAB 1: ÓRDENES ACTIVAS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <Card key={order.id} className="hover:border-primary/40 transition-colors relative group shadow-sm">
              <CardContent className="p-4 md:p-6 space-y-3">
                {/* Full-width Title Header */}
                <div className="w-full">
                  <Link href={`/dashboard/work-orders/${order.id}`}>
                    <h3 className="text-lg sm:text-xl font-extrabold text-foreground leading-snug break-words hover:text-primary transition-colors">
                      {order.title}
                    </h3>
                  </Link>
                </div>

                {/* Badges & Status Sub-header + Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={statusColors[order.status] || 'default'}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                    <Badge variant={priorityColors[order.priority]} className="text-xs font-semibold">
                      Prioridad: {priorityLabels[order.priority] || order.priority}
                    </Badge>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="h-8 text-xs font-semibold px-2 bg-muted/80 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-muted"
                      title="Cambiar Estado Rápido"
                    >
                      <option value="ABIERTA">Abierta</option>
                      <option value="EN_PROCESO">En Progreso</option>
                      <option value="PAUSADA">En Pausa</option>
                      <option value="PENDIENTE_REPUESTO">Pendiente Repuesto</option>
                      <option value="FINALIZADA">Finalizar Orden (Archivar)</option>
                      <option value="CANCELADA">Cancelar Orden</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingOrder(order)}
                      title="Editar Orden"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingOrder(order)}
                      title="Eliminar Orden"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <Link href={`/dashboard/work-orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Ver Detalles">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Description, Asset info, Technician details */}
                <div className="text-xs text-muted-foreground space-y-2 pt-1">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {order.description || 'Sin descripción'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-xs text-muted-foreground pt-2 border-t border-border/40">
                    <span>
                      <strong className="text-foreground">Activo:</strong> {order.asset?.name || 'N/A'} {order.asset?.code ? `(${order.asset.code})` : ''}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      <strong className="text-foreground">Tipo:</strong> {typeLabels[order.type] || order.type}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      <strong className="text-foreground">Técnico:</strong> {order.technician?.name || 'N/A'}
                    </span>
                    {order.externalVendor && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-primary font-medium">
                          <strong className="text-foreground">Contratista:</strong> {order.externalVendor.name}
                        </span>
                      </>
                    )}
                    <span className="hidden md:inline">•</span>
                    <span className="font-mono sm:ml-auto">
                      <strong className="text-foreground">Creada:</strong> {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Active Empty State */}
          {activeOrders.length === 0 && (
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-foreground">
                  ¡Excelente! No hay órdenes de trabajo pendientes.
                </h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  Todas las órdenes de trabajo activas han sido completadas o trasladadas al historial.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: HISTORIAL DE ÓRDENES / FINALIZADAS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <Card className="bg-card">
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, tag o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Asset Filter Dropdown */}
                <div className="relative">
                  <select
                    value={assetFilter}
                    onChange={(e) => setAssetFilter(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="ALL">-- Todos los Activos --</option>
                    {uniqueAssets.map((ast) => (
                      <option key={ast.id} value={ast.id}>
                        {ast.name} ({ast.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date Picker */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fecha Desde:</span>
                  </div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* End Date Picker */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fecha Hasta:</span>
                  </div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {(searchQuery || assetFilter !== 'ALL' || startDate || endDate) && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setAssetFilter('ALL')
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Order Cards List */}
          <div className="space-y-4">
            {filteredHistoryOrders.map((order) => {
              const completionDate = order.completedAt || order.closedAt || order.createdAt
              const isCancelled = order.status === 'CANCELADA'

              return (
                <Card
                  key={order.id}
                  className="hover:border-emerald-500/40 transition-colors relative group shadow-sm bg-card"
                >
                  <CardContent className="p-4 md:p-6 space-y-3">
                    {/* Title & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Link href={`/dashboard/work-orders/${order.id}`}>
                        <h3 className="text-lg font-extrabold text-foreground leading-snug break-words hover:text-primary transition-colors">
                          {order.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCancelled ? (
                          <Badge variant="destructive" className="font-semibold">
                            Cancelada
                          </Badge>
                        ) : (
                          <Badge variant="success" className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-white">
                            Finalizada
                          </Badge>
                        )}
                        <Badge variant={priorityColors[order.priority]} className="text-xs">
                          {priorityLabels[order.priority] || order.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Completion Timestamp Banner & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        {isCancelled ? (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            Cancelada el {formatDateTime(completionDate)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            Finalizada el {formatDateTime(completionDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <Link href={`/dashboard/work-orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:border-primary">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            Ver Detalle / PDF
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Meta Details */}
                    <div className="text-xs text-muted-foreground space-y-2 pt-1">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {order.description || 'Sin descripción'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-xs text-muted-foreground pt-2 border-t border-border/40">
                        <span>
                          <strong className="text-foreground">Activo:</strong> {order.asset?.name || 'N/A'} {order.asset?.code ? `(${order.asset.code})` : ''}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          <strong className="text-foreground">Tipo:</strong> {typeLabels[order.type] || order.type}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          <strong className="text-foreground">Técnico:</strong> {order.technician?.name || 'N/A'}
                        </span>
                        {order.laborHours ? (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              <strong className="text-foreground">Mano de Obra:</strong> {order.laborHours}h
                            </span>
                          </>
                        ) : null}
                        <span className="hidden md:inline">•</span>
                        <span className="font-mono sm:ml-auto">
                          <strong className="text-foreground">Creada:</strong> {formatDateTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* History Empty State */}
            {filteredHistoryOrders.length === 0 && (
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground">No se encontraron órdenes finalizadas</h4>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {historyOrders.length === 0
                      ? 'Aún no hay órdenes de trabajo finalizadas en el historial.'
                      : 'No hay resultados que coincidan con los filtros seleccionados.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingOrder && (
        <WorkOrderEditModal
          isOpen={!!editingOrder}
          workOrder={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={() => {
            fetchOrders()
            router.refresh()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Orden de Trabajo?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de eliminar la orden <strong>"{deletingOrder.title}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingOrder(null)}
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
