'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { WorkOrderEditModal } from '@/components/work-orders/work-order-edit-modal'
import {
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
  X
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
  laborHours?: number | null
  externalVendorId?: string | null
  guidelineId?: string | null
  asset: { id: string; name: string; code: string }
  technician: { id: string; name: string; role: string }
  externalVendor?: { id: string; name: string; category: string } | null
  materials?: {
    id?: string
    inventoryItemId: string
    quantityUsed: number
    inventoryItem?: {
      id?: string
      name: string
      unit: string
      stock: number
    }
  }[]
  tools?: {
    id?: string
    toolId: string
    tool?: {
      id: string
      code?: string
      name: string
      category?: string
    }
  }[]
}

const statusColors: Record<string, any> = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'secondary',
  CLOSED: 'success',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  CLOSED: 'Cerrada',
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

export function WorkOrdersList() {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
      const res = await fetch(`/api/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          closedAt: newStatus === 'CLOSED' ? new Date().toISOString() : null,
        }),
      })

      if (res.ok) {
        await fetchOrders()
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating status:', error)
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
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting order:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Cargando órdenes de trabajo...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {workOrders.map((order) => (
        <Card key={order.id} className="hover:border-primary/40 transition-colors relative group">
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
                <Badge variant={statusColors[order.status]}>
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
                  className="h-8 text-xs font-semibold px-2 bg-muted/60 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  title="Cambiar Estado Rápido"
                >
                  <option value="OPEN">Abierta</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="ON_HOLD">En Pausa</option>
                  <option value="CLOSED">Cerrada</option>
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

      {workOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay órdenes de trabajo registradas
            </p>
          </CardContent>
        </Card>
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
