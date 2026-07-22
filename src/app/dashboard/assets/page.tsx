import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { AssetsList } from '@/components/assets/assets-list'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

async function getAssets() {
  const assets = await prisma.asset.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          workOrders: true,
          failureLogs: true,
        },
      },
    },
  })
  return JSON.parse(JSON.stringify(assets))
}

export default async function AssetsPage() {
  const initialAssets = await getAssets()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Activos</h2>
        <Link href="/dashboard/assets/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Activo
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando activos...</div>}>
        <AssetsList initialAssets={initialAssets} />
      </Suspense>
    </div>
  )
}
