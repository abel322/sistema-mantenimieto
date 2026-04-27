import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

async function getTopFailures() {
  const failures = await prisma.failureLog.groupBy({
    by: ['assetId'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5,
  })

  const assetsWithFailures = await Promise.all(
    failures.map(async (failure) => {
      const asset = await prisma.asset.findUnique({
        where: { id: failure.assetId },
      })
      return {
        asset: asset?.name || 'Desconocido',
        count: failure._count.id,
      }
    })
  )

  return assetsWithFailures
}

export async function TopFailures() {
  const failures = await getTopFailures()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Fallas (Pareto)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {failures.map((failure, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {failure.asset}
                </p>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(failure.count / failures[0].count) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="ml-4 text-sm font-medium">{failure.count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
