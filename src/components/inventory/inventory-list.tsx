import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, Package } from 'lucide-react'
import Link from 'next/link'

async function getParts() {
  return prisma.part.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function InventoryList() {
  const parts = await getParts()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {parts.map((part) => {
        const isLowStock = part.stock <= part.minStock
        const isOutOfStock = part.stock === 0

        return (
          <Link key={part.id} href={`/dashboard/inventory/${part.id}`}>
            <Card
              className={`hover:bg-accent transition-colors cursor-pointer h-full ${
                isOutOfStock ? 'border-destructive' : isLowStock ? 'border-yellow-500' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{part.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {part.code}
                        </p>
                      </div>
                    </div>
                    {isLowStock && (
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          isOutOfStock ? 'text-destructive' : 'text-yellow-500'
                        }`}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Stock actual
                      </span>
                      <Badge
                        variant={
                          isOutOfStock
                            ? 'destructive'
                            : isLowStock
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {part.stock} {part.unit}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Stock mínimo
                      </span>
                      <span>{part.minStock} {part.unit}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Precio</span>
                      <span className="font-semibold">
                        {formatCurrency(part.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}

      {parts.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay repuestos registrados en el inventario
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
