import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssetForm } from '@/components/assets/asset-form'

async function getAsset(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
  })

  if (!asset) {
    notFound()
  }

  return JSON.parse(JSON.stringify(asset))
}

export default async function EditAssetPage({
  params,
}: {
  params: { id: string }
}) {
  const asset = await getAsset(params.id)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Editar Activo</h2>
        <p className="text-muted-foreground">
          Modifica los detalles del activo {asset.name} ({asset.code})
        </p>
      </div>

      <AssetForm initialData={asset} />
    </div>
  )
}
