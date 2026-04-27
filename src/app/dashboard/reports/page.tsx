import { Suspense } from 'react'
import { ReportsGrid } from '@/components/reports/reports-grid'

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reportes</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Genera reportes en PDF de órdenes, activos e inventario
        </p>
      </div>

      <Suspense fallback={<div>Cargando reportes...</div>}>
        <ReportsGrid />
      </Suspense>
    </div>
  )
}
