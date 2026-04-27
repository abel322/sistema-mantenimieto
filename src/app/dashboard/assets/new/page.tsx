import { AssetForm } from '@/components/assets/asset-form'

export default function NewAssetPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Activo</h2>
        <p className="text-muted-foreground">
          Registra un nuevo activo en el sistema
        </p>
      </div>

      <AssetForm />
    </div>
  )
}
