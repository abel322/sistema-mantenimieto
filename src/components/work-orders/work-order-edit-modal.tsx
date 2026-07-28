'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { X, Save, Loader2, BookOpen, Package, Wrench, Plus, Trash2, AlertCircle } from 'lucide-react'

interface AssetOption {
  id: string
  name: string
  code: string
}

interface TechnicianOption {
  id: string
  name: string
  role: string
}

interface SupplierOption {
  id: string
  name: string
  category: string
}

interface GuidelineOption {
  id: string
  code: string
  title: string
  description?: string | null
  category?: string | null
}

interface InventoryItemOption {
  id: string
  code: string
  name: string
  stock: number
  unit: string
  price?: number
}

interface ToolOption {
  id: string
  code: string
  name: string
  category: string
  type: string
  status: string
}

interface MaterialSelection {
  inventoryItemId: string
  quantityUsed: number
  name: string
  unit: string
  stock: number
}

export interface WorkOrderEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  workOrder: {
    id: string
    title: string
    description?: string | null
    assetId: string
    priority: string
    type: string
    technicianId: string
    status: string
    laborHours?: number | null
    externalVendorId?: string | null
    guidelineId?: string | null
    materials?: {
      id?: string
      inventoryItemId: string
      quantityUsed: number
      inventoryItem?: {
        id?: string
        name: string
        unit: string
        stock: number
      }
    }[]
    tools?: {
      id?: string
      toolId: string
      tool?: {
        id: string
        code?: string
        name: string
        category?: string
      }
    }[]
  }
}

export function WorkOrderEditModal({
  isOpen,
  onClose,
  onSuccess,
  workOrder,
}: WorkOrderEditModalProps) {
  const [title, setTitle] = useState(workOrder.title)
  const [description, setDescription] = useState(workOrder.description || '')
  const [assetId, setAssetId] = useState(workOrder.assetId)
  const [priority, setPriority] = useState(workOrder.priority)
  const [type, setType] = useState(workOrder.type)
  const [technicianId, setTechnicianId] = useState(workOrder.technicianId)
  const [status, setStatus] = useState(workOrder.status)
  const [laborHours, setLaborHours] = useState(workOrder.laborHours?.toString() || '0')
  const [externalVendorId, setExternalVendorId] = useState(workOrder.externalVendorId || '')

  // Section a) Guideline state
  const [guidelineId, setGuidelineId] = useState(workOrder.guidelineId || '')

  // Section b) Materials state
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([])
  const [currentPartId, setCurrentPartId] = useState<string>('')
  const [currentQuantity, setCurrentQuantity] = useState<string>('1')

  // Section c) Tools state
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])

  // Options states
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([])
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [guidelines, setGuidelines] = useState<GuidelineOption[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([])
  const [tools, setTools] = useState<ToolOption[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && workOrder) {
      setTitle(workOrder.title)
      setDescription(workOrder.description || '')
      setAssetId(workOrder.assetId)
      setPriority(workOrder.priority)
      setType(workOrder.type)
      setTechnicianId(workOrder.technicianId)
      setStatus(workOrder.status)
      setLaborHours(workOrder.laborHours?.toString() || '0')
      setExternalVendorId(workOrder.externalVendorId || '')
      setGuidelineId(workOrder.guidelineId || '')

      if (workOrder.materials && Array.isArray(workOrder.materials)) {
        setSelectedMaterials(
          workOrder.materials.map((m) => ({
            inventoryItemId: m.inventoryItemId,
            quantityUsed: m.quantityUsed,
            name: m.inventoryItem?.name || 'Item de inventario',
            unit: m.inventoryItem?.unit || 'unidad',
            stock: m.inventoryItem?.stock ?? 0,
          }))
        )
      } else {
        setSelectedMaterials([])
      }

      if (workOrder.tools && Array.isArray(workOrder.tools)) {
        setSelectedToolIds(workOrder.tools.map((t) => t.toolId))
      } else {
        setSelectedToolIds([])
      }

      // Fetch options for the form
      Promise.all([
        fetch('/api/assets', { cache: 'no-store' }).then((res) => res.json()),
        fetch('/api/technicians', { cache: 'no-store' }).then((res) => res.json()),
        fetch('/api/suppliers?status=ACTIVE', { cache: 'no-store' }).then((res) => res.json()),
        fetch('/api/guidelines', { cache: 'no-store' }).then((res) => res.json()),
        fetch('/api/inventory', { cache: 'no-store' }).then((res) => res.json()),
        fetch('/api/tools', { cache: 'no-store' }).then((res) => res.json()),
      ])
        .then(([astData, techData, supData, guideData, invData, toolData]) => {
          setAssets(Array.isArray(astData) ? astData : [])
          setTechnicians(Array.isArray(techData) ? techData : [])
          setSuppliers(Array.isArray(supData) ? supData : [])
          setGuidelines(Array.isArray(guideData) ? guideData : [])
          setInventoryItems(Array.isArray(invData) ? invData : [])
          setTools(Array.isArray(toolData) ? toolData : [])
        })
        .catch((err) => console.error('Error fetching modal dropdown options:', err))
    }
  }, [isOpen, workOrder])

  if (!isOpen) return null

  function handleAddMaterial() {
    if (!currentPartId) return
    const part = inventoryItems.find((p) => p.id === currentPartId)
    if (!part) return

    const qty = parseFloat(currentQuantity)
    if (isNaN(qty) || qty <= 0) return

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('El título de la orden es obligatorio')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          assetId,
          priority,
          type,
          technicianId,
          status,
          laborHours: parseFloat(laborHours) || 0,
          externalVendorId: externalVendorId || null,
          guidelineId: guidelineId || null,
          materials: selectedMaterials.map((m) => ({
            inventoryItemId: m.inventoryItemId,
            quantityUsed: m.quantityUsed,
          })),
          tools: selectedToolIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar la orden')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al actualizar la orden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div>
            <h3 className="text-xl font-bold">Editar Orden de Trabajo</h3>
            <p className="text-sm text-muted-foreground">
              Modifica los detalles, pautas técnicas, materiales y herramientas asignadas.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* General Information Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Información General</CardTitle>
              <CardDescription>
                Datos básicos para la orden de trabajo de mantenimiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="font-semibold text-sm">
                    Título *
                  </Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-assetId" className="font-semibold text-sm">
                    Activo / Maquinaria *
                  </Label>
                  <Select
                    id="edit-assetId"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccionar activo --</option>
                    {assets.map((ast) => (
                      <option key={ast.id} value={ast.id}>
                        {ast.name} ({ast.code})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type" className="font-semibold text-sm">
                    Tipo *
                  </Label>
                  <Select
                    id="edit-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                  >
                    <option value="PREVENTIVE">Preventivo</option>
                    <option value="CORRECTIVE">Correctivo</option>
                    <option value="PREDICTIVE">Predictivo</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-priority" className="font-semibold text-sm">
                    Prioridad *
                  </Label>
                  <Select
                    id="edit-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-technicianId" className="font-semibold text-sm">
                    Técnico Asignado *
                  </Label>
                  <Select
                    id="edit-technicianId"
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccionar técnico --</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.role})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="font-semibold text-sm">
                    Estado *
                  </Label>
                  <Select
                    id="edit-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="OPEN">Abierta</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="ON_HOLD">En Pausa</option>
                    <option value="CLOSED">Cerrada</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-laborHours" className="font-semibold text-sm">
                    Horas Hombre de Mano de Obra
                  </Label>
                  <Input
                    id="edit-laborHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-externalVendorId" className="font-semibold text-sm">
                    Contratista / Proveedor Externo (Opcional)
                  </Label>
                  <Select
                    id="edit-externalVendorId"
                    value={externalVendorId}
                    onChange={(e) => setExternalVendorId(e.target.value)}
                  >
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
                <Label htmlFor="edit-description" className="font-semibold text-sm">
                  Descripción / Detalle del Trabajo *
                </Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Section a: Pauta Técnica Vinculada */}
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
                <Label htmlFor="edit-guidelineId" className="font-semibold text-sm">
                  Seleccionar Pauta Técnica
                </Label>
                <Select
                  id="edit-guidelineId"
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

          {/* Section b: Materiales y Repuestos Requeridos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">b) Materiales y Repuestos Requeridos</CardTitle>
              </div>
              <CardDescription>
                Agrega o remueve ítems de inventario. El stock se descontará automáticamente al finalizar la orden (`Cerrada`).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-2 flex-1 w-full">
                  <Label htmlFor="edit-partSelect" className="font-semibold text-sm">
                    Item de Inventario
                  </Label>
                  <Select
                    id="edit-partSelect"
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
                  <Label htmlFor="edit-partQuantity" className="font-semibold text-sm">
                    Cantidad
                  </Label>
                  <Input
                    id="edit-partQuantity"
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

          {/* Section c: Herramientas y Equipos Necesarios */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">c) Herramientas y Equipos Necesarios</CardTitle>
              </div>
              <CardDescription>
                Selecciona las herramientas asignadas o requeridas para esta orden de trabajo.
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

          {/* Footer Actions */}
          <div className="border-t pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
