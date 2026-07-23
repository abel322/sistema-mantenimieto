import { Suspense } from 'react'
import { InventoryView } from './inventory-view'

export const dynamic = 'force-dynamic'

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>}>
      <InventoryView />
    </Suspense>
  )
}
