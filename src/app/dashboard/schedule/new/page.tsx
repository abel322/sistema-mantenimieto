import { ScheduleForm } from '@/components/schedule/schedule-form'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getAssets() {
  return prisma.asset.findMany({ orderBy: { name: 'asc' } })
}

export default async function NewSchedulePage() {
  const assets = await getAssets()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Nueva Programación de Mantenimiento
        </h2>
        <p className="text-muted-foreground">
          Programa mantenimiento preventivo para un activo
        </p>
      </div>

      <ScheduleForm assets={assets} />
    </div>
  )
}
