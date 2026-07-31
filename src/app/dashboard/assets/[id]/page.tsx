import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssetDetail } from '@/components/assets/asset-detail'

async function getAsset(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      parts: {
        include: {
          preferredSupplier: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
      workOrders: {
        include: {
          technician: true,
          externalVendor: true,
          materials: {
            include: {
              inventoryItem: true,
            },
          },
          partsUsed: {
            include: { part: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      failureLogs: {
        orderBy: {
          reportedAt: 'desc',
        },
      },
      maintenanceLogs: {
        orderBy: {
          executionDate: 'desc',
        },
      },
      checklistExecutions: {
        include: {
          template: {
            include: {
              items: true,
            },
          },
          technician: true,
          workOrders: true,
          responses: {
            include: {
              item: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
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
    <div className="flex-1 space-y-4 p-3 sm:p-6 md:p-8 pt-4 sm:pt-6 w-full max-w-full overflow-x-hidden">
      <AssetDetail asset={asset} />
    </div>
  )
}
