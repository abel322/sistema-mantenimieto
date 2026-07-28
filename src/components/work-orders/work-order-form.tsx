'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, BookOpen, Package, Wrench, AlertCircle, Loader2 } from 'lucide-react'
import { createWorkOrder } from '@/app/actions/work-orders'
import type { Asset, User, TechnicalGuideline, Part, Tool } from '@prisma/client'

interface SupplierOption {
  id: string
  name: string
  category: string
}

interface MaterialSelection {
  inventoryItemId: string
  quantityUsed: number
  name: string
  unit: string
  stock: number
}

interface WorkOrderFormProps {
  assets: Asset[]
  technicians: User[]
  guidelines?: TechnicalGuideline[]
  inventoryItems?: Part[]
  tools?: Tool[]
}

export function WorkOrderForm({
  assets,
  technicians,
  guidelines = [],
  inventoryItems = [],
  tools = [],
}: WorkOrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])

  // Selection states
  const [guidelineId, setGuidelineId] = useState<string>('')
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([])
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])

  // Material picker state
  const [currentPartId, setCurrentPartId] = useState<string>('')
  const [currentQuantity, setCurrentQuantity] = useState<string>('1')

  useEffect(() => {
    fetch('/api/suppliers?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  function handleAddMaterial() {
    if (!currentPartId) return
    const part = inventoryItems.find((p) => p.id === currentPartId)
    if (!part) return

    const qty = parseFloat(currentQuantity)
    if (isNaN(qty) || qty <= 0) return

    // Check if already added
    const existingIndex = selectedMaterials.findIndex((m) => m.inventoryItemId === currentPartId)
    if (existingIndex >= 0) {
      const updated = [...selectedMaterials]
      updated[existingIndex].quantityUsed += qty
      setSelectedMaterials(updated)
    } else {
      setSelectedMaterials((prev) => [
        ...prev,
        {
          inventoryItemId: part.id,
          quantityUsed: qty,
          name: part.name,
          unit: part.unit || 'unidad',
          stock: part.stock,
        },
      ])
    }

    setCurrentPartId('')
    setCurrentQuantity('1')
  }

  function handleRemoveMaterial(inventoryItemId: string) {
    setSelectedMaterials((prev) => prev.filter((m) => m.inventoryItemId !== inventoryItemId))
  }

  function handleToggleTool(toolId: string) {
    setSelectedToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const priority = formData.get('priority') as string
    const assetId = formData.get('assetId') as string
    const technicianId = formData.get('technicianId') as string
    const externalVendorId = (formData.get('externalVendorId') as string) || null

    const result = await createWorkOrder({
      title,
      description,
      type,
      priority,
      assetId,
      technicianId,
      guidelineId: guidelineId || null,
      externalVendorId,
      materials: selectedMaterials.map((m) => ({
        inventoryItemId: m.inventoryItemId,
        quantityUsed: m.quantityUsed,
      })),
      tools: selectedToolIds,
    })

    if (result.success) {
      router.push('/dashboard/work-orders')
      router.refresh()
    } else {
      setErrorMessage(result.error || 'Error al crear la orden de trabajo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Información General</CardTitle>
          <CardDescription>
            Datos básicos para la orden de trabajo de mantenimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">
                Título *
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Ej: Cambio de electroválvulas neumáticas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetId" className="font-semibold">
                Activo / Equipo *
              </Label>
              <Select id="assetId" name="assetId" required>
                <option value="">-- Seleccionar activo --</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="font-semibold">
                Tipo *
              </Label>
              <Select id="type" name="type" required>
                <option value="">-- Seleccionar tipo --</option>
                <option value="PREVENTIVE">Preventivo</option>
                <option value="CORRECTIVE">Correctivo</option>
                <option value="PREDICTIVE">Predictivo</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="font-semibold">
                Prioridad *
              </Label>
              <Select id="priority" name="priority" required>
                <option value="">-- Seleccionar prioridad --</option>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicianId" className="font-semibold">
                Técnico Asignado *
              </Label>
              <Select id="technicianId" name="technicianId" required>
                <option value="">-- Seleccionar técnico --</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.role})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalVendorId" className="font-semibold">
                Contratista / Proveedor Externo (Opcional)
              </Label>
              <Select id="externalVendorId" name="externalVendorId">
                <option value="">-- Trabajo Interno / Ninguno --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.category})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Descripción / Detalle del Trabajo *
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe detalladamente las acciones a ejecutar en el equipo..."
              rows={4}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Section A: Pauta Técnica Vinculada */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">a) Pauta Técnica Vinculada (Opcional)</CardTitle>
          </div>
          <CardDescription>
            Asocia un procedimiento operativo estándar (SOP) o guía técnica predefinida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xl">
            <Label htmlFor="guidelineId" className="font-semibold">
              Seleccionar Pauta Técnica
            </Label>
            <Select
              id="guidelineId"
              value={guidelineId}
              onChange={(e) => setGuidelineId(e.target.value)}
            >
              <option value="">-- Ninguna / Sin pauta predefinida --</option>
              {guidelines.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code}: {g.title} {g.category ? `(${g.category})` : ''}
                </option>
              ))}
            </Select>
            {guidelineId && (
              <p className="text-xs text-muted-foreground pt-1">
                {guidelines.find((g) => g.id === guidelineId)?.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section B: Materiales y Repuestos Requeridos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">b) Materiales y Repuestos Requeridos</CardTitle>
          </div>
          <CardDescription>
            Agrega items del inventario. El stock se descontará automáticamente al finalizar la orden (`FINALIZADA`).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-2 flex-1 w-full">
              <Label htmlFor="partSelect" className="font-semibold">
                Item de Inventario
              </Label>
              <Select
                id="partSelect"
                value={currentPartId}
                onChange={(e) => setCurrentPartId(e.target.value)}
              >
                <option value="">-- Seleccionar repuesto / material --</option>
                {inventoryItems.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.name} ({part.code}) - Stock: {part.stock} {part.unit}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 w-full sm:w-32">
              <Label htmlFor="partQuantity" className="font-semibold">
                Cantidad
              </Label>
              <Input
                id="partQuantity"
                type="number"
                step="any"
                min="0.1"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                placeholder="1"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleAddMaterial}
              disabled={!currentPartId}
              className="w-full sm:w-auto flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Material</span>
            </Button>
          </div>

          {/* List of Added Materials */}
          {selectedMaterials.length > 0 ? (
            <div className="border rounded-md overflow-hidden divide-y mt-3">
              <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground grid grid-cols-12 gap-2">
                <span className="col-span-6">Material / Repuesto</span>
                <span className="col-span-3 text-right">Cantidad</span>
                <span className="col-span-3 text-right">Acciones</span>
              </div>
              {selectedMaterials.map((mat) => (
                <div
                  key={mat.inventoryItemId}
                  className="px-4 py-3 text-sm flex items-center justify-between grid grid-cols-12 gap-2"
                >
                  <div className="col-span-6 font-medium">
                    {mat.name}
                    <span className="block text-xs text-muted-foreground">
                      Stock actual: {mat.stock} {mat.unit}
                    </span>
                  </div>
                  <div className="col-span-3 text-right font-semibold">
                    {mat.quantityUsed} {mat.unit}
                  </div>
                  <div className="col-span-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMaterial(mat.inventoryItemId)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-md bg-muted/20">
              No se han agregado materiales ni repuestos a esta orden.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C: Herramientas y Equipos Necesarios */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">c) Herramientas y Equipos Necesarios</CardTitle>
          </div>
          <CardDescription>
            Selecciona las herramientas asignadas o requeridas del módulo de herramientas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tools.map((t) => {
                const isChecked = selectedToolIds.includes(t.id)
                return (
                  <label
                    key={t.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border bg-card hover:bg-accent/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleTool(t.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="space-y-0.5">
                      <span className="block">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.code} • {t.category}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-md bg-muted/20">
              No hay herramientas registradas en el módulo.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[140px]">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creando...</span>
            </div>
          ) : (
            'Crear Orden'
          )}
        </Button>
      </div>
    </form>
  )
}
