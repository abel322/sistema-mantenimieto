import { WorkOrderForm } from '@/components/work-orders/work-order-form'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getFormData() {
  const [assets, technicians, guidelines, inventoryItems, tools] = await Promise.all([
    prisma.asset.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
    prisma.technicalGuideline.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
    prisma.part.findMany({ orderBy: { name: 'asc' } }),
    prisma.tool.findMany({ orderBy: { name: 'asc' } }),
  ])

  return { assets, technicians, guidelines, inventoryItems, tools }
}

export default async function NewWorkOrderPage() {
  const { assets, technicians, guidelines, inventoryItems, tools } = await getFormData()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Nueva Orden de Trabajo
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Crea una nueva orden de trabajo para mantenimiento con pautas técnicas, materiales y herramientas.
        </p>
      </div>

      <WorkOrderForm
        assets={assets}
        technicians={technicians}
        guidelines={guidelines}
        inventoryItems={inventoryItems}
        tools={tools}
      />
    </div>
  )
}
