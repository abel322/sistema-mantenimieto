'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { generateWorkOrderPDF } from '@/lib/pdf-generator'

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

export function WorkOrdersReportList() {
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/work-orders')
      .then((res) => res.json())
      .then(setWorkOrders)
  }, [])

  async function handleGeneratePDF(orderId: string) {
    setLoading(orderId)
    try {
      const response = await fetch(`/api/work-orders/${orderId}`)
      const workOrder = await response.json()

      const doc = generateWorkOrderPDF(workOrder)
      doc.save(`orden-trabajo-${workOrder.id.slice(0, 8)}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el reporte')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {workOrders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{order.title}</h3>
                  <Badge variant={statusColors[order.status as keyof typeof statusColors]}>
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.asset.name} • {order.technician.name} •{' '}
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <Button
                onClick={() => handleGeneratePDF(order.id)}
                disabled={loading === order.id}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {loading === order.id ? 'Generando...' : 'Generar PDF'}
              </Button>
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
    </div>
  )
}
