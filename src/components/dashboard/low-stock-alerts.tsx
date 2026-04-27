import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

async function getLowStockParts() {
  return prisma.$queryRaw<
    Array<{ id: string; name: string; code: string; stock: number; minStock: number }>
  >`
    SELECT id, name, code, stock, "minStock"
    FROM "Part"
    WHERE stock <= "minStock"
    ORDER BY stock ASC
    LIMIT 5
  `
}

export async function LowStockAlerts() {
  const parts = await getLowStockParts()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Alertas de Stock Bajo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {parts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay alertas de stock bajo
            </p>
          ) : (
            parts.map((part) => (
              <Link
                key={part.id}
                href={`/dashboard/inventory/${part.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {part.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{part.code}</p>
                </div>
                <div className="text-right">
                  <Badge variant={part.stock === 0 ? 'destructive' : 'warning'}>
                    {part.stock} / {part.minStock}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
