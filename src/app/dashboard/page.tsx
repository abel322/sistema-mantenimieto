import { Suspense } from 'react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentWorkOrders } from '@/components/dashboard/recent-work-orders'
import { TopFailures } from '@/components/dashboard/top-failures'
import { MaintenanceChart } from '@/components/dashboard/maintenance-chart'
import { LowStockAlerts } from '@/components/dashboard/low-stock-alerts'
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <Suspense fallback={<div>Cargando estadísticas...</div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-2 lg:col-span-4">
          <Suspense fallback={<div>Cargando gráfico...</div>}>
            <MaintenanceChart />
          </Suspense>
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <Suspense fallback={<div>Cargando alertas...</div>}>
            <LowStockAlerts />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-2 lg:col-span-4">
          <Suspense fallback={<div>Cargando órdenes...</div>}>
            <RecentWorkOrders />
          </Suspense>
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <Suspense fallback={<div>Cargando fallas...</div>}>
            <TopFailures />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
