import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

async function getWorkOrders() {
  return prisma.workOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      asset: true,
      technician: true,
    },
  })
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

export async function WorkOrdersList() {
  const workOrders = await getWorkOrders()

  return (
    <div className="space-y-4">
      {workOrders.map((order) => (
        <Link key={order.id} href={`/dashboard/work-orders/${order.id}`}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base md:text-lg font-semibold">{order.title}</h3>
                      <Badge variant={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                      <Badge variant={priorityColors[order.priority]}>
                        {priorityLabels[order.priority]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {order.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <strong>Activo:</strong> {order.asset.name}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <strong>Tipo:</strong> {typeLabels[order.type]}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <strong>Técnico:</strong> {order.technician.name}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="flex items-center gap-1">
                    <strong>Creada:</strong> {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
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
