import { Suspense } from 'react'
import { AssetsReportList } from '@/components/reports/assets-report-list'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AssetsReportPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Reportes de Activos
          </h2>
          <p className="text-muted-foreground">
            Selecciona un activo para generar su reporte en PDF
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Cargando activos...</div>}>
        <AssetsReportList />
      </Suspense>
    </div>
  )
}
