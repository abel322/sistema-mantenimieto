import { WorkOrderForm } from '@/components/work-orders/work-order-form'
import { prisma } from '@/lib/prisma'

async function getFormData() {
  const [assets, technicians] = await Promise.all([
    prisma.asset.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
  ])

  return { assets, technicians }
}

export default async function NewWorkOrderPage() {
  const { assets, technicians } = await getFormData()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Nueva Orden de Trabajo
        </h2>
        <p className="text-muted-foreground">
          Crea una nueva orden de trabajo para mantenimiento
        </p>
      </div>

      <WorkOrderForm assets={assets} technicians={technicians} />
    </div>
  )
}
