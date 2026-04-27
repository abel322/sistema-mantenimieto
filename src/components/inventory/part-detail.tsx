'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ArrowLeft, Package, Plus, Minus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { Part, PartOnOrder, WorkOrder, Asset } from '@prisma/client'

type PartWithRelations = Part & {
  workOrders: (PartOnOrder & {
    workOrder: WorkOrder & {
      asset: Asset
    }
  })[]
}

interface PartDetailProps {
  part: PartWithRelations
}

export function PartDetail({ part }: PartDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const isLowStock = part.stock <= part.minStock
  const isOutOfStock = part.stock === 0

  const totalUsed = part.workOrders.reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  async function updateStock(adjustment: number) {
    setLoading(true)
    try {
      const response = await fetch(`/api/inventory/${part.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: part.stock + adjustment,
        }),
      })

      if (response.ok) {
        router.refresh()
        setQuantity(1)
      }
    } catch (error) {
      console.error('Error updating stock:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{part.name}</h2>
              <p className="text-muted-foreground">{part.code}</p>
            </div>
          </div>
        </div>
        {isLowStock && (
          <Badge variant={isOutOfStock ? 'destructive' : 'warning'}>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {isOutOfStock ? 'Sin Stock' : 'Stock Bajo'}
          </Badge>
        )}
      </div>

      {/* Información General */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {part.stock} {part.unit}
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo: {part.minStock} {part.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(part.price)}
            </div>
            <p className="text-xs text-muted-foreground">Por {part.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsed} {part.unit}
            </div>
            <p className="text-xs text-muted-foreground">Histórico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(part.stock * part.price)}
            </div>
            <p className="text-xs text-muted-foreground">Inventario</p>
          </CardContent>
        </Card>
      </div>

      {/* Ajustar Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Ajustar Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button
              onClick={() => updateStock(quantity)}
              disabled={loading}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
            <Button
              variant="outline"
              onClick={() => updateStock(-quantity)}
              disabled={loading || part.stock < quantity}
              className="gap-2"
            >
              <Minus className="h-4 w-4" />
              Retirar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Repuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Categoría
              </p>
              <p className="text-lg font-semibold">
                {part.category || 'Sin categoría'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Unidad de Medida
              </p>
              <p className="text-lg font-semibold">{part.unit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          {part.workOrders.length > 0 ? (
            <div className="space-y-3">
              {part.workOrders.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/work-orders/${item.workOrder.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {item.workOrder.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.workOrder.asset.name} •{' '}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {item.quantity} {part.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.quantity * part.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay historial de uso registrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
