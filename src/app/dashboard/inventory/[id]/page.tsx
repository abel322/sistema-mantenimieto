import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PartDetail } from '@/components/inventory/part-detail'

async function getPart(id: string) {
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      workOrders: {
        include: {
          workOrder: {
            include: {
              asset: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  })

  if (!part) {
    notFound()
  }

  return part
}

export default async function PartDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const part = await getPart(params.id)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PartDetail part={part} />
    </div>
  )
}
