import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { WorkOrdersList } from '@/components/work-orders/work-orders-list'

export default function WorkOrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Órdenes de Trabajo</h2>
        <Link href="/dashboard/work-orders/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando órdenes...</div>}>
        <WorkOrdersList />
      </Suspense>
    </div>
  )
}
