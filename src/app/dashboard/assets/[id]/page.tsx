import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssetDetail } from '@/components/assets/asset-detail'

async function getAsset(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      workOrders: {
        include: {
          technician: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      failureLogs: {
        orderBy: {
          reportedAt: 'desc',
        },
        take: 10,
      },
      maintenanceLogs: {
        orderBy: {
          executionDate: 'desc',
        },
        take: 10,
      },
      schedules: {
        where: {
          isActive: true,
        },
      },
    },
  })

  if (!asset) {
    notFound()
  }

  return asset
}

export default async function AssetDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const asset = await getAsset(params.id)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <AssetDetail asset={asset} />
    </div>
  )
}
