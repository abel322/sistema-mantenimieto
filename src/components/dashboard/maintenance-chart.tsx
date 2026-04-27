import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

async function getMaintenanceData() {
  const workOrders = await prisma.workOrder.groupBy({
    by: ['type', 'status'],
    _count: {
      id: true,
    },
  })

  const preventive = workOrders
    .filter((wo) => wo.type === 'PREVENTIVE')
    .reduce((acc, wo) => acc + wo._count.id, 0)

  const corrective = workOrders
    .filter((wo) => wo.type === 'CORRECTIVE')
    .reduce((acc, wo) => acc + wo._count.id, 0)

  const predictive = workOrders
    .filter((wo) => wo.type === 'PREDICTIVE')
    .reduce((acc, wo) => acc + wo._count.id, 0)

  const total = preventive + corrective + predictive

  return {
    preventive,
    corrective,
    predictive,
    total,
    pmpPercentage: total > 0 ? ((preventive / total) * 100).toFixed(1) : '0',
  }
}

export async function MaintenanceChart() {
  const data = await getMaintenanceData()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Mantenimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Preventivo</span>
              <span className="text-sm text-muted-foreground">
                {data.preventive} ({data.pmpPercentage}%)
              </span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${data.total > 0 ? (data.preventive / data.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Correctivo</span>
              <span className="text-sm text-muted-foreground">
                {data.corrective}
              </span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${data.total > 0 ? (data.corrective / data.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Predictivo</span>
              <span className="text-sm text-muted-foreground">
                {data.predictive}
              </span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${data.total > 0 ? (data.predictive / data.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              PMP (Porcentaje de Mantenimiento Preventivo):{' '}
              <span className="font-bold text-foreground">
                {data.pmpPercentage}%
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Objetivo: Mantener &gt; 60%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
