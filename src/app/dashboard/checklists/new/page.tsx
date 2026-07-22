'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChecklistTemplate } from '@/types/checklists'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ClipboardCheck, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Wrench, 
  Send, 
  Loader2, 
  Check, 
  X 
} from 'lucide-react'
import Link from 'next/link'

interface Asset {
  id: string
  name: string
  code: string
  area: string
}

function NewInspectionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [assets, setAssets] = useState<Asset[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [currentTemplate, setCurrentTemplate] = useState<ChecklistTemplate | null>(null)

  // Response form values state: { [itemId]: { valueBoolean, valueNumeric, valueText, notes } }
  const [responses, setResponses] = useState<
    Record<
      string,
      {
        valueBoolean?: boolean
        valueNumeric?: string
        valueText?: string
        notes?: string
      }
    >
  >({})

  const [generalNotes, setGeneralNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submissionResult, setSubmissionResult] = useState<{
    executionId: string
    status: string
    autoWorkOrder?: { id: string; title: string }
  } | null>(null)

  // Load assets and templates on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [assetsRes, templatesRes] = await Promise.all([
          fetch('/api/assets'),
          fetch('/api/checklists/templates'),
        ])

        if (assetsRes.ok && templatesRes.ok) {
          const loadedAssets = await assetsRes.json()
          const loadedTemplates = await templatesRes.json()

          setAssets(loadedAssets)
          setTemplates(loadedTemplates)

          // Pre-select asset if query param is present, or first asset
          const preselectedAssetId = searchParams.get('assetId') || loadedAssets[0]?.id || ''
          setSelectedAssetId(preselectedAssetId)
        }
      } catch (err) {
        console.error('Error loading initial data:', err)
        setErrorMessage('Error al cargar activos y plantillas')
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [searchParams])

  // When selected asset changes, automatically match best template or pick first
  useEffect(() => {
    if (!selectedAssetId || assets.length === 0 || templates.length === 0) return

    const asset = assets.find((a) => a.id === selectedAssetId)
    if (asset) {
      // Find template matching asset area or assetType
      const matchedTemplate =
        templates.find((t) => t.assetType === asset.area) ||
        templates.find((t) => t.title.toLowerCase().includes(asset.name.toLowerCase())) ||
        templates[0]

      if (matchedTemplate) {
        setSelectedTemplateId(matchedTemplate.id)
      }
    }
  }, [selectedAssetId, assets, templates])

  // When selected template changes, load template details and initialize default response values
  useEffect(() => {
    if (!selectedTemplateId) {
      setCurrentTemplate(null)
      return
    }

    const tpl = templates.find((t) => t.id === selectedTemplateId)
    if (tpl) {
      setCurrentTemplate(tpl)
      // Initialize response state for each item
      const initialResponses: Record<string, any> = {}
      tpl.items?.forEach((item) => {
        initialResponses[item.id] = {
          valueBoolean: true, // Default to true (OK)
          valueNumeric: item.minValue !== null && item.minValue !== undefined ? String(item.minValue) : '',
          valueText: '',
          notes: '',
        }
      })
      setResponses(initialResponses)
    }
  }, [selectedTemplateId, templates])

  // Calculate live failed state to alert technician
  const getFailedItems = () => {
    if (!currentTemplate) return []

    const failedList: { label: string; reason: string }[] = []

    currentTemplate.items?.forEach((item) => {
      const resp = responses[item.id]
      if (!resp) return

      if (item.type === 'BOOLEAN') {
        if (resp.valueBoolean === false) {
          failedList.push({
            label: item.label,
            reason: 'Marcado como NO OK / Anómalo',
          })
        }
      } else if (item.type === 'NUMERIC') {
        const val = parseFloat(resp.valueNumeric || '')
        if (!isNaN(val)) {
          if (item.minValue !== null && item.minValue !== undefined && val < item.minValue) {
            failedList.push({
              label: item.label,
              reason: `Valor ${val} menor al mínimo (${item.minValue})`,
            })
          } else if (item.maxValue !== null && item.maxValue !== undefined && val > item.maxValue) {
            failedList.push({
              label: item.label,
              reason: `Valor ${val} supera el máximo (${item.maxValue})`,
            })
          }
        }
      }
    })

    return failedList
  }

  const failedItems = getFailedItems()
  const hasFailures = failedItems.length > 0

  const handleBooleanChange = (itemId: string, value: boolean) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], valueBoolean: value },
    }))
  }

  const handleNumericChange = (itemId: string, val: string) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], valueNumeric: val },
    }))
  }

  const handleTextChange = (itemId: string, val: string) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], valueText: val },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAssetId || !selectedTemplateId || !currentTemplate) {
      setErrorMessage('Seleccione un activo y una plantilla válida.')
      return
    }

    // Validate required fields
    for (const item of currentTemplate.items) {
      if (item.isRequired) {
        const resp = responses[item.id]
        if (!resp) {
          setErrorMessage(`Complete el ítem obligatorio: "${item.label}"`)
          return
        }
        if (item.type === 'NUMERIC' && (resp.valueNumeric === undefined || resp.valueNumeric === '')) {
          setErrorMessage(`Ingrese la lectura numérica para: "${item.label}"`)
          return
        }
      }
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        templateId: selectedTemplateId,
        assetId: selectedAssetId,
        notes: generalNotes,
        responses: currentTemplate.items.map((item) => ({
          itemId: item.id,
          valueBoolean: responses[item.id]?.valueBoolean,
          valueNumeric: responses[item.id]?.valueNumeric,
          valueText: responses[item.id]?.valueText,
          notes: responses[item.id]?.notes,
        })),
      }

      const res = await fetch('/api/checklists/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Error al guardar la inspección')
      }

      const data = await res.json()
      setSubmissionResult({
        executionId: data.execution.id,
        status: data.execution.status,
        autoWorkOrder: data.autoWorkOrder,
      })
    } catch (err: any) {
      console.error('Submission error:', err)
      setErrorMessage(err.message || 'Error al guardar la inspección.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm font-medium">Cargando datos para la inspección...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/checklists">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Inspecciones
          </Button>
        </Link>
      </div>

      {/* Main Form Container */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Ejecutar Inspección de Maquinaria</CardTitle>
              <CardDescription>
                Formulario de verificación en piso para operadores y técnicos de mantenimiento.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Submission Success Toast Alert Modal */}
          {submissionResult ? (
            <div className="space-y-6 p-6 border rounded-xl bg-accent/30 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">¡Inspección Registrada Exitosamente!</h3>
                <p className="text-muted-foreground text-sm">
                  La inspección ha sido procesada y guardada con estado:{' '}
                  <Badge variant={submissionResult.status === 'PASSED' ? 'success' : 'destructive'}>
                    {submissionResult.status}
                  </Badge>
                </p>
              </div>

              {submissionResult.autoWorkOrder && (
                <div className="p-4 border-2 border-destructive bg-destructive/10 rounded-lg text-left space-y-3">
                  <div className="flex items-center gap-2 text-destructive font-bold">
                    <Wrench className="w-5 h-5" />
                    <span>Se generó automáticamente una Orden de Trabajo Correctiva:</span>
                  </div>
                  <p className="text-sm font-semibold">{submissionResult.autoWorkOrder.title}</p>
                  <p className="text-xs text-muted-foreground">
                    La orden de trabajo fue creada con Prioridad ALTA y estado ABIERTA para intervención inmediata.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <Link href="/dashboard/checklists">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Ir al Dashboard de Inspecciones
                  </Button>
                </Link>

                {submissionResult.autoWorkOrder && (
                  <Link href="/dashboard/work-orders">
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Wrench className="w-4 h-4 mr-2" /> Ver Orden de Trabajo Correctiva
                    </Button>
                  </Link>
                )}

                <Button
                  onClick={() => {
                    setSubmissionResult(null)
                    setGeneralNotes('')
                  }}
                  className="w-full sm:w-auto"
                >
                  Registrar Otra Inspección
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 bg-destructive/15 text-destructive border border-destructive/30 rounded-lg text-sm font-medium flex items-center gap-2">
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selection Section: Asset & Template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-card border shadow-sm">
                <div className="space-y-2">
                  <Label htmlFor="assetSelect" className="font-semibold text-sm">
                    1. Seleccione el Activo / Maquinaria *
                  </Label>
                  <Select
                    id="assetSelect"
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    required
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code}) - {a.area}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateSelect" className="font-semibold text-sm">
                    2. Plantilla de Inspección *
                  </Label>
                  <Select
                    id="templateSelect"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    required
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.items?.length || 0} ítems)
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Template Items Form */}
              {currentTemplate && (
                <div className="space-y-6">
                  <div className="border-b pb-3">
                    <h3 className="text-lg font-bold text-foreground">
                      {currentTemplate.title}
                    </h3>
                    {currentTemplate.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentTemplate.description}
                      </p>
                    )}
                  </div>

                  {/* Dynamic Floor Technician Field Controls */}
                  <div className="space-y-4">
                    {currentTemplate.items.map((item, idx) => {
                      const itemResp = responses[item.id] || {}
                      const isBoolean = item.type === 'BOOLEAN'
                      const isNumeric = item.type === 'NUMERIC'
                      const isText = item.type === 'TEXT'

                      // Check if this specific item is failing
                      let itemFailed = false
                      let itemFailureMsg = ''

                      if (isBoolean && itemResp.valueBoolean === false) {
                        itemFailed = true
                        itemFailureMsg = 'Marcado NO OK'
                      } else if (isNumeric) {
                        const numVal = parseFloat(itemResp.valueNumeric || '')
                        if (!isNaN(numVal)) {
                          if (item.minValue !== null && item.minValue !== undefined && numVal < item.minValue) {
                            itemFailed = true
                            itemFailureMsg = `< Mínimo (${item.minValue})`
                          } else if (item.maxValue !== null && item.maxValue !== undefined && numVal > item.maxValue) {
                            itemFailed = true
                            itemFailureMsg = `> Máximo (${item.maxValue})`
                          }
                        }
                      }

                      return (
                        <div
                          key={item.id}
                          className={`p-4 md:p-5 border-2 rounded-xl transition-all ${
                            itemFailed
                              ? 'border-destructive bg-destructive/5 shadow-md'
                              : 'border-border bg-card hover:border-primary/40'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Item Label & Limits */}
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted">
                                  #{idx + 1}
                                </span>
                                <span className="font-semibold text-base">
                                  {item.label}
                                </span>
                                {item.isRequired && (
                                  <span className="text-destructive font-bold text-xs" title="Campo Requerido">
                                    *
                                  </span>
                                )}
                              </div>

                              {isNumeric && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  Rango Estándar: [{item.minValue ?? '-∞'} ~ {item.maxValue ?? '+∞'}]
                                </p>
                              )}
                            </div>

                            {/* Touch-Friendly Control Inputs */}
                            <div className="w-full md:w-auto min-w-[220px]">
                              {/* BOOLEAN: Large Floor Technician Buttons */}
                              {isBoolean && (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleBooleanChange(item.id, true)}
                                    className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                                      itemResp.valueBoolean === true
                                        ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-600/30'
                                        : 'bg-background text-muted-foreground border-border hover:border-green-600/50'
                                    }`}
                                  >
                                    <Check className="w-5 h-5" /> OK
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleBooleanChange(item.id, false)}
                                    className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                                      itemResp.valueBoolean === false
                                        ? 'bg-destructive text-destructive-foreground border-destructive shadow-md ring-2 ring-destructive/30'
                                        : 'bg-background text-muted-foreground border-border hover:border-destructive/50'
                                    }`}
                                  >
                                    <X className="w-5 h-5" /> NO OK
                                  </button>
                                </div>
                              )}

                              {/* NUMERIC Input */}
                              {isNumeric && (
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="Valor leído"
                                    value={itemResp.valueNumeric || ''}
                                    onChange={(e) => handleNumericChange(item.id, e.target.value)}
                                    className={`text-lg font-mono py-2 text-center border-2 ${
                                      itemFailed ? 'border-destructive text-destructive focus:ring-destructive' : ''
                                    }`}
                                    required={item.isRequired}
                                  />
                                  {itemFailed && (
                                    <span className="text-[11px] text-destructive font-bold block text-center">
                                      ⚠️ {itemFailureMsg}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* TEXT Input */}
                              {isText && (
                                <Input
                                  placeholder="Escriba la observación..."
                                  value={itemResp.valueText || ''}
                                  onChange={(e) => handleTextChange(item.id, e.target.value)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* General Observations */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="generalNotes" className="font-semibold">
                      Observaciones Generales de la Inspección
                    </Label>
                    <Textarea
                      id="generalNotes"
                      placeholder="Ingrese notas adicionales para el turno o comentarios de mantenimiento..."
                      rows={3}
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                    />
                  </div>

                  {/* Auto Work Order Live Warning Banner */}
                  {hasFailures && (
                    <div className="p-4 border-2 border-destructive bg-destructive/10 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-destructive font-bold text-base">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-bounce" />
                        <span>¡Atención! Se han detectado {failedItems.length} fallas en la inspección</span>
                      </div>
                      <p className="text-xs text-destructive/90 pl-8">
                        Al enviar esta inspección, el sistema **creará automáticamente una Orden de Trabajo Correctiva** con prioridad **ALTA** dirigida al departamento de mantenimiento con el detalle de las fallas.
                      </p>
                      <div className="pl-8 text-xs space-y-1 pt-1 font-semibold text-destructive">
                        {failedItems.map((fi, i) => (
                          <div key={i}>• {fi.label}: <span className="underline">{fi.reason}</span></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4 border-t flex justify-end gap-4">
                    <Link href="/dashboard/checklists">
                      <Button type="button" variant="outline" size="lg" disabled={submitting}>
                        Cancelar
                      </Button>
                    </Link>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className={hasFailures ? 'bg-destructive hover:bg-destructive/90 text-white' : ''}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando Inspección...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" /> Guardar Inspección
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewInspectionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground text-sm font-medium">
            Cargando formulario de inspección...
          </p>
        </div>
      }
    >
      <NewInspectionForm />
    </Suspense>
  )
}

