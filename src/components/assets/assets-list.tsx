import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getAssets() {
  return prisma.asset.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          workOrders: true,
          failureLogs: true,
        },
      },
    },
  })
}

const areaLabels = {
  EXTRUSION: 'Extrusión',
  PRINTING: 'Impresión',
  SEALING: 'Sellado/Corte',
  AUXILIARY: 'Servicios Auxiliares',
}

const criticalityColors = {
  1: 'secondary',
  2: 'warning',
  3: 'destructive',
} as const

export async function AssetsList() {
  const assets = await getAssets()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => (
        <Link key={asset.id} href={`/dashboard/assets/${asset.id}`}>
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {asset.code}
                    </p>
                  </div>
                  <Badge variant={criticalityColors[asset.criticality as 1 | 2 | 3]}>
                    Criticidad {asset.criticality}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm">
                    <strong>Área:</strong> {areaLabels[asset.area]}
                  </p>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {asset.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                  <span>{asset._count.workOrders} OT</span>
                  <span>{asset._count.failureLogs} Fallas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {assets.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay activos registrados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
