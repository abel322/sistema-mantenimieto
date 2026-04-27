import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

async function getRecentWorkOrders() {
  return prisma.workOrder.findMany({
    take: 5,
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

export async function RecentWorkOrders() {
  const workOrders = await getRecentWorkOrders()

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Órdenes de Trabajo Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workOrders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/work-orders/${order.id}`}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {order.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.asset.name} • {order.technician.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <Badge variant={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
