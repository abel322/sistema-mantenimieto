'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TaskPlan, MachineStatus } from '@/types/procedures'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Wrench, 
  Box, 
  CheckSquare, 
  Loader2, 
  Check, 
  AlertTriangle 
} from 'lucide-react'
import Link from 'next/link'

import { PLANT_AREAS } from '@/lib/constants'

interface InventoryPart {
  id: string
  name: string
  code: string
  stock: number
  unit: string
}

interface ProcedureFormProps {
  initialData?: TaskPlan | null
  isEdit?: boolean
}

export function ProcedureForm({ initialData, isEdit = false }: ProcedureFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [assetType, setAssetType] = useState(initialData?.assetType || 'SEALING')
  const [frequency, setFrequency] = useState(initialData?.frequency || 'MENSUAL')
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialData?.estimatedMinutes || 60)
  const [machineStatus, setMachineStatus] = useState<MachineStatus>(initialData?.machineStatus || 'STOPPED_LOTO')
  const [requiredSkill, setRequiredSkill] = useState(initialData?.requiredSkill || 'Mecánico / Electricista')

  // Tools & Safety Equipment Tags State
  const [tools, setTools] = useState<string[]>(initialData?.tools || ['Llave Allen set', 'Multímetro'])
  const [newTool, setNewTool] = useState('')

  const [safetyEquipment, setSafetyEquipment] = useState<string[]>(
    initialData?.safetyEquipment || ['Guantes térmicos', 'Lentes de seguridad', 'Tarjeta LOTO']
  )
  const [newEpp, setNewEpp] = useState('')

  // Inventory parts loaded from API
  const [inventoryParts, setInventoryParts] = useState<InventoryPart[]>([])

  // Consumable materials state
  const [materials, setMaterials] = useState<
    { partId?: string; materialName: string; quantity: number; unit: string }[]
  >(
    initialData?.materials?.map((m) => ({
      partId: m.partId || undefined,
      materialName: m.materialName,
      quantity: m.quantity,
      unit: m.unit,
    })) || []
  )

  // Steps state
  const [steps, setSteps] = useState<
    { stepNumber: number; description: string; referenceVal?: string; isMandatory: boolean }[]
  >(
    initialData?.steps?.map((s) => ({
      stepNumber: s.stepNumber,
      description: s.description,
      referenceVal: s.referenceVal || '',
      isMandatory: s.isMandatory ?? true,
    })) || [
      { stepNumber: 1, description: 'Aplicar consignación LOTO en tablero principal.', referenceVal: 'Verificar 0V y 0 Bar', isMandatory: true },
      { stepNumber: 2, description: 'Inspeccionar componentes críticos.', referenceVal: 'Conforme a especificación del manual', isMandatory: true },
    ]
  )

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch inventory parts for consumables picker
  useEffect(() => {
    async function loadParts() {
      try {
        const res = await fetch('/api/inventory')
        if (res.ok) {
          const data = await res.json()
          setInventoryParts(data)
        }
      } catch (err) {
        console.error('Error loading inventory parts:', err)
      }
    }
    loadParts()
  }, [])

  // EPP Presets
  const eppPresets = [
    'Guantes térmicos',
    'Lentes de seguridad',
    'Tarjeta LOTO',
    'Calzado dieléctrico',
    'Protección auditiva',
    'Casco de protección',
  ]

  const addEppTag = (tag: string) => {
    if (tag && !safetyEquipment.includes(tag)) {
      setSafetyEquipment([...safetyEquipment, tag])
    }
  }

  const removeEppTag = (index: number) => {
    const copy = [...safetyEquipment]
    copy.splice(index, 1)
    setSafetyEquipment(copy)
  }

  const addToolTag = () => {
    if (newTool.trim() && !tools.includes(newTool.trim())) {
      setTools([...tools, newTool.trim()])
      setNewTool('')
    }
  }

  const removeToolTag = (index: number) => {
    const copy = [...tools]
    copy.splice(index, 1)
    setTools(copy)
  }

  // Materials Handlers
  const addMaterialRow = () => {
    setMaterials([
      ...materials,
      { materialName: '', quantity: 1, unit: 'unidad' },
    ])
  }

  const removeMaterialRow = (idx: number) => {
    const copy = [...materials]
    copy.splice(idx, 1)
    setMaterials(copy)
  }

  const handleSelectPart = (idx: number, partId: string) => {
    const copy = [...materials]
    const part = inventoryParts.find((p) => p.id === partId)
    if (part) {
      copy[idx] = {
        partId: part.id,
        materialName: part.name,
        quantity: copy[idx].quantity || 1,
        unit: part.unit || 'unidad',
      }
    } else {
      copy[idx].partId = undefined
    }
    setMaterials(copy)
  }

  // Step Handlers
  const addStepRow = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        description: '',
        referenceVal: '',
        isMandatory: true,
      },
    ])
  }

  const removeStepRow = (idx: number) => {
    if (steps.length <= 1) {
      setErrorMsg('El procedimiento debe tener al menos 1 paso.')
      return
    }
    const copy = [...steps]
    copy.splice(idx, 1)
    // Re-index step numbers
    const reindexed = copy.map((s, i) => ({ ...s, stepNumber: i + 1 }))
    setSteps(reindexed)
  }

  const updateStep = (idx: number, field: string, val: any) => {
    const copy = [...steps]
    copy[idx] = { ...copy[idx], [field]: val }
    setSteps(copy)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setErrorMsg('El título del procedimiento es obligatorio.')
      return
    }

    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].description.trim()) {
        setErrorMsg(`Complete la instrucción del Paso #${i + 1}.`)
        return
      }
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const payload = {
        title,
        description,
        assetType,
        frequency,
        estimatedMinutes: Number(estimatedMinutes),
        machineStatus,
        requiredSkill,
        tools,
        safetyEquipment,
        steps,
        materials,
      }

      const url = isEdit ? `/api/procedures/${initialData?.id}` : '/api/procedures'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Error al guardar la pauta técnica')
      }

      router.push('/dashboard/procedures')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error al guardar la pauta técnica.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/procedures">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Pautas Técnicas
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {isEdit ? 'Editar Pauta Técnica / SOP' : 'Nueva Pauta Técnica / SOP de Mantenimiento'}
              </CardTitle>
              <CardDescription>
                Diseñe el protocolo estandarizado, normas de seguridad LOTO y repuestos asociados.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {errorMsg && (
            <div className="p-4 bg-destructive/15 text-destructive border border-destructive/30 rounded-lg text-sm font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Section 1: General Specifications */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> 1. Especificaciones Generales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="font-semibold">
                  Título de la Pauta / Procedimiento *
                </Label>
                <Input
                  id="title"
                  placeholder="Ej. Mantenimiento Preventivo Mensual - Barra Selladora Bolseras"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetType" className="font-semibold">
                  Área / Tipo de Maquinaria *
                </Label>
                <Select
                  id="assetType"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                >
                  {PLANT_AREAS.map((pa) => (
                    <option key={pa.value} value={pa.value}>
                      {pa.label} ({pa.value})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency" className="font-semibold">
                  Frecuencia de Ejecución *
                </Label>
                <Select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="DIARIO">Diario</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                  <option value="PREVENTIVO_300H">Por Horas (Cada 300H)</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="machineStatus" className="font-semibold">
                  Estado Requerido de la Máquina *
                </Label>
                <Select
                  id="machineStatus"
                  value={machineStatus}
                  onChange={(e) => setMachineStatus(e.target.value as MachineStatus)}
                >
                  <option value="STOPPED_LOTO">🛑 MÁQUINA PARADA - Consignación LOTO</option>
                  <option value="RUNNING">🟢 EN MARCHA - Equipo Operando</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedMinutes" className="font-semibold">
                  Duración Estimada (Minutos) *
                </Label>
                <Input
                  id="estimatedMinutes"
                  type="number"
                  min="5"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="requiredSkill" className="font-semibold">
                  Especialidad / Perfil Técnico Requerido
                </Label>
                <Input
                  id="requiredSkill"
                  placeholder="Ej. Mecánico / Electricista / Instrumentista"
                  value={requiredSkill}
                  onChange={(e) => setRequiredSkill(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="font-semibold">
                  Descripción / Objetivo del SOP
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describa brevemente el objetivo y alcance del procedimiento..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Safety & Tools */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> 2. Seguridad LOTO & Herramientas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EPP Chips */}
              <div className="space-y-3 p-4 border rounded-lg bg-card">
                <Label className="font-semibold text-sm block">EPP / Equipo de Protección Personal</Label>
                <p className="text-xs text-muted-foreground">
                  Haga clic en los presets o escriba equipos adicionales:
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {eppPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => addEppTag(preset)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        safetyEquipment.includes(preset)
                          ? 'bg-amber-500 text-white border-amber-500 font-bold'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Input
                    placeholder="Otro EPP (ej. Guantes dieléctricos)"
                    value={newEpp}
                    onChange={(e) => setNewEpp(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      addEppTag(newEpp.trim())
                      setNewEpp('')
                    }}
                  >
                    Agregar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {safetyEquipment.map((item, idx) => (
                    <Badge key={idx} variant="warning" className="text-xs flex items-center gap-1">
                      {item}
                      <button type="button" onClick={() => removeEppTag(idx)} className="hover:text-red-800">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tools Tags */}
              <div className="space-y-3 p-4 border rounded-lg bg-card">
                <Label className="font-semibold text-sm block">Herramientas Requeridas</Label>
                <p className="text-xs text-muted-foreground">
                  Ingrese las herramientas necesarias para la tarea:
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Ej. Llave fija 17mm, Multímetro"
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToolTag()
                      }
                    }}
                    className="text-xs"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addToolTag}>
                    Agregar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tools.map((tool, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1">
                      🔧 {tool}
                      <button type="button" onClick={() => removeToolTag(idx)} className="hover:text-red-800">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Consumables & Inventory Parts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" /> 3. Repuestos & Consumibles Asociados
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addMaterialRow}>
                <Plus className="w-4 h-4 mr-1" /> Agregar Material
              </Button>
            </div>

            <div className="space-y-3">
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3 border rounded-md">
                  No hay repuestos ni consumibles asociados.
                </p>
              ) : (
                materials.map((mat, idx) => {
                  const linkedPart = inventoryParts.find((p) => p.id === mat.partId)
                  return (
                    <div key={idx} className="p-3 border rounded-lg bg-card space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Linked inventory part picker */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-xs font-semibold">Vincular Repuesto de Inventario</Label>
                          <Select
                            value={mat.partId || ''}
                            onChange={(e) => handleSelectPart(idx, e.target.value)}
                          >
                            <option value="">-- Sin Vincular (Nombre Libre) --</option>
                            {inventoryParts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.code}) - Stock: {p.stock} {p.unit}
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Material Name */}
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-xs font-semibold">Nombre del Consumible</Label>
                          <Input
                            placeholder="Ej. Cinta teflonada 3/4"
                            value={mat.materialName}
                            onChange={(e) => {
                              const copy = [...materials]
                              copy[idx].materialName = e.target.value
                              setMaterials(copy)
                            }}
                            required
                          />
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-xs font-semibold">Cantidad</Label>
                          <Input
                            type="number"
                            step="any"
                            min="0.1"
                            value={mat.quantity}
                            onChange={(e) => {
                              const copy = [...materials]
                              copy[idx].quantity = Number(e.target.value)
                              setMaterials(copy)
                            }}
                            required
                          />
                        </div>

                        {/* Delete button */}
                        <div className="sm:col-span-1 flex justify-end pt-5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeMaterialRow(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stock availability indicator */}
                      {linkedPart && (
                        <div className="text-xs font-mono pt-1 flex items-center justify-between text-muted-foreground">
                          <span>Stock en Almacén: {linkedPart.stock} {linkedPart.unit}</span>
                          {linkedPart.stock < mat.quantity ? (
                            <span className="text-destructive font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Stock insuficiente para esta tarea
                            </span>
                          ) : (
                            <span className="text-green-600 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Stock Disponible OK
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Section 4: Step Sequence */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" /> 4. Protocolo de Pasos Secuenciales
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addStepRow}>
                <Plus className="w-4 h-4 mr-1" /> Agregar Paso
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 border-2 rounded-xl bg-card space-y-3 border-l-4 border-l-primary relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                      Paso #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeStepRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-7 space-y-1">
                      <Label className="text-xs font-semibold">Instrucción Detallada *</Label>
                      <Input
                        placeholder="Ej. Retirar cinta teflonada desgastada y limpiar la barra..."
                        value={step.description}
                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-5 space-y-1">
                      <Label className="text-xs font-semibold">Referencia Técnica / Setpoint</Label>
                      <Input
                        placeholder="Ej. Setpoint: 160°C ± 5°C, Torque: 85 Nm"
                        value={step.referenceVal || ''}
                        onChange={(e) => updateStep(idx, 'referenceVal', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t pt-4 flex justify-end gap-3">
            <Link href="/dashboard/procedures">
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </Link>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Guardar Pauta Técnica
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
