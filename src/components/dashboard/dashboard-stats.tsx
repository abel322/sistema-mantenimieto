import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { Activity, AlertTriangle, Clock, TrendingUp } from 'lucide-react'

async function getStats() {
  const [totalWorkOrders, openWorkOrders, totalAssets, lowStockParts] =
    await Promise.all([
      prisma.workOrder.count(),
      prisma.workOrder.count({ where: { status: { not: 'CLOSED' } } }),
      prisma.asset.count(),
      prisma.part.count({
        where: {
          stock: {
            lte: prisma.part.fields.minStock,
          },
        },
      }),
    ])

  // Calcular MTTR (Mean Time To Repair) - promedio de horas de trabajo
  const closedOrders = await prisma.workOrder.findMany({
    where: { status: 'CLOSED', laborHours: { not: null } },
    select: { laborHours: true },
  })

  const mttr =
    closedOrders.length > 0
      ? closedOrders.reduce((acc, order) => acc + (order.laborHours || 0), 0) /
        closedOrders.length
      : 0

  return {
    totalWorkOrders,
    openWorkOrders,
    totalAssets,
    lowStockParts,
    mttr: mttr.toFixed(1),
  }
}

export async function DashboardStats() {
  const stats = await getStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Órdenes Abiertas
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openWorkOrders}</div>
          <p className="text-xs text-muted-foreground">
            de {stats.totalWorkOrders} totales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MTTR Promedio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.mttr}h</div>
          <p className="text-xs text-muted-foreground">
            Tiempo medio de reparación
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Activos Totales</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAssets}</div>
          <p className="text-xs text-muted-foreground">
            Máquinas registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Alertas de Stock
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.lowStockParts}</div>
          <p className="text-xs text-muted-foreground">
            Repuestos bajo mínimo
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
