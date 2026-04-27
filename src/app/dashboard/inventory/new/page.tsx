import { PartForm } from '@/components/inventory/part-form'

export default function NewPartPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Repuesto</h2>
        <p className="text-muted-foreground">
          Registra un nuevo repuesto en el inventario
        </p>
      </div>

      <PartForm />
    </div>
  )
}
