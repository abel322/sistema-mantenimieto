'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Edit, CheckCircle, XCircle, Clock, Pause, FileText } from 'lucide-react'
import { generateWorkOrderPDF } from '@/lib/pdf-generator'
import Link from 'next/link'
import type { WorkOrder, Asset, User, PartOnOrder, Part } from '@prisma/client'

type WorkOrderWithRelations = WorkOrder & {
  asset: Asset
  technician: User
  partsUsed: (PartOnOrder & { part: Part })[]
}

interface WorkOrderDetailProps {
  workOrder: WorkOrderWithRelations
}

const statusColors = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'secondary',
  CLOSED: 'success',
} as const

const statusLabels = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  CLOSED: 'Cerrada',
}

const typeLabels = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
}

const priorityColors = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'destructive',
} as const

const priorityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export function WorkOrderDetail({ workOrder }: WorkOrderDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const totalPartsCost = workOrder.partsUsed.reduce(
    (acc, item) => acc + item.part.price * item.quantity,
    0
  )

  const laborCost = (workOrder.laborHours || 0) * 150 // $150/hora ejemplo

  const totalCost = totalPartsCost + laborCost

  async function handleGeneratePDF() {
    try {
      const doc = generateWorkOrderPDF(workOrder)
      doc.save(`orden-trabajo-${workOrder.id.slice(0, 8)}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el reporte')
    }
  }

  async function updateStatus(newStatus: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          closedAt: newStatus === 'CLOSED' ? new Date() : null,
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-2 md:gap-4">
          <Link href="/dashboard/work-orders">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight break-words">
              {workOrder.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Orden #{workOrder.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusColors[workOrder.status]}>
            {statusLabels[workOrder.status]}
          </Badge>
          <Badge variant={priorityColors[workOrder.priority]}>
            {priorityLabels[workOrder.priority]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Información Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tipo de Mantenimiento
                </p>
                <p className="text-base md:text-lg font-semibold">
                  {typeLabels[workOrder.type]}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Activo
                </p>
                <p className="text-base md:text-lg font-semibold">{workOrder.asset.name}</p>
                <p className="text-sm text-muted-foreground">
                  {workOrder.asset.code}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Técnico Asignado
                </p>
                <p className="text-base md:text-lg font-semibold">
                  {workOrder.technician.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Horas de Trabajo
                </p>
                <p className="text-base md:text-lg font-semibold">
                  {workOrder.laborHours || 0}h
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Descripción
              </p>
              <p className="text-sm">{workOrder.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fecha de Creación
                </p>
                <p className="text-sm">{formatDateTime(workOrder.createdAt)}</p>
              </div>
              {workOrder.closedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fecha de Cierre
                  </p>
                  <p className="text-sm">{formatDateTime(workOrder.closedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workOrder.status === 'OPEN' && (
              <Button
                className="w-full"
                onClick={() => updateStatus('IN_PROGRESS')}
                disabled={loading}
              >
                <Clock className="mr-2 h-4 w-4" />
                Iniciar Trabajo
              </Button>
            )}
            {workOrder.status === 'IN_PROGRESS' && (
              <>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus('ON_HOLD')}
                  disabled={loading}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </Button>
                <Button
                  className="w-full"
                  onClick={() => updateStatus('CLOSED')}
                  disabled={loading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completar
                </Button>
              </>
            )}
            {workOrder.status === 'ON_HOLD' && (
              <Button
                className="w-full"
                onClick={() => updateStatus('IN_PROGRESS')}
                disabled={loading}
              >
                <Clock className="mr-2 h-4 w-4" />
                Reanudar
              </Button>
            )}
            {workOrder.status === 'CLOSED' && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => updateStatus('OPEN')}
                disabled={loading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reabrir
              </Button>
            )}
            <Button variant="outline" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              Editar Orden
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGeneratePDF}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Repuestos Utilizados */}
      <Card>
        <CardHeader>
          <CardTitle>Repuestos Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrder.partsUsed.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium">
                        Repuesto
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Código
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        Cantidad
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        Precio Unit.
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.partsUsed.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 text-sm">{item.part.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {item.part.code}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {formatCurrency(item.part.price)}
                        </td>
                        <td className="p-3 text-sm text-right font-medium">
                          {formatCurrency(item.part.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No se han registrado repuestos utilizados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Costos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Costo de Repuestos</span>
              <span className="font-medium">{formatCurrency(totalPartsCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Mano de Obra ({workOrder.laborHours || 0}h × $150)
              </span>
              <span className="font-medium">{formatCurrency(laborCost)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>Total</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
