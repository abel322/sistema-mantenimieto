import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WorkOrderDetail } from '@/components/work-orders/work-order-detail'

async function getWorkOrder(id: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      asset: true,
      technician: true,
      partsUsed: {
        include: {
          part: true,
        },
      },
    },
  })

  if (!workOrder) {
    notFound()
  }

  return workOrder
}

export default async function WorkOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const workOrder = await getWorkOrder(params.id)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <WorkOrderDetail workOrder={workOrder} />
    </div>
  )
}
