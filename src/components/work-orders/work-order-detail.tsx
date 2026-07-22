'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Edit, CheckCircle, XCircle, Clock, Pause, FileText } from 'lucide-react'
import { generateWorkOrderPDF } from '@/lib/pdf-generator'
import Link from 'next/link'
import type { WorkOrder, Asset, User, PartOnOrder, Part } from '@prisma/client'

import { ShieldAlert, Wrench, Box, CheckSquare, Zap, AlertTriangle, BookOpen } from 'lucide-react'

type WorkOrderWithRelations = WorkOrder & {
  asset: Asset
  technician: User
  partsUsed: (PartOnOrder & { part: Part })[]
  taskPlan?: {
    id: string
    title: string
    description?: string | null
    assetType: string
    frequency: string
    estimatedMinutes: number
    machineStatus: string
    requiredSkill: string
    tools: string[]
    safetyEquipment: string[]
    steps: {
      id: string
      stepNumber: number
      description: string
      referenceVal?: string | null
      isMandatory: boolean
    }[]
    materials: {
      id: string
      materialName: string
      quantity: number
      unit: string
      part?: Part | null
    }[]
  } | null
}

interface WorkOrderDetailProps {
  workOrder: WorkOrderWithRelations
}

const statusColors = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'secondary',
  CLOSED: 'success',
} as const

const statusLabels = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  CLOSED: 'Cerrada',
}

const typeLabels = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
}

const priorityColors = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'destructive',
} as const

const priorityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export function WorkOrderDetail({ workOrder }: WorkOrderDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }))
  }

  const plan = workOrder.taskPlan
  const isLoto = plan?.machineStatus === 'STOPPED_LOTO'
  const lowStockMaterials = plan?.materials?.filter(
    (m) => m.part && m.part.stock < m.quantity
  )

  const totalPartsCost = workOrder.partsUsed.reduce(
    (acc, item) => acc + item.part.price * item.quantity,
    0
  )

  const laborCost = (workOrder.laborHours || 0) * 150 // $150/hora ejemplo

  const totalCost = totalPartsCost + laborCost

  async function handleGeneratePDF() {
    try {
      const doc = generateWorkOrderPDF(workOrder)
      doc.save(`orden-trabajo-${workOrder.id.slice(0, 8)}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el reporte')
    }
  }

  async function updateStatus(newStatus: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          closedAt: newStatus === 'CLOSED' ? new Date() : null,
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-2 md:gap-4">
          <Link href="/dashboard/work-orders">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight break-words">
              {workOrder.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Orden #{workOrder.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusColors[workOrder.status]}>
            {statusLabels[workOrder.status]}
          </Badge>
          <Badge variant={priorityColors[workOrder.priority]}>
            {priorityLabels[workOrder.priority]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Información Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tipo de Mantenimiento
                </p>
                <p className="text-base md:text-lg font-semibold">
                  {typeLabels[workOrder.type]}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Activo
                </p>
                <p className="text-base md:text-lg font-semibold">{workOrder.asset.name}</p>
                <p className="text-sm text-muted-foreground">
                  {workOrder.asset.code}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Técnico Asignado
                </p>
                <p className="text-base md:text-lg font-semibold">
                  {workOrder.technician.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Horas de Trabajo
                </p>
                <p className="text-base md:text-lg font-semibold">
                  {workOrder.laborHours || 0}h
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Descripción
              </p>
              <p className="text-sm">{workOrder.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fecha de Creación
                </p>
                <p className="text-sm">{formatDateTime(workOrder.createdAt)}</p>
              </div>
              {workOrder.closedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fecha de Cierre
                  </p>
                  <p className="text-sm">{formatDateTime(workOrder.closedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workOrder.status === 'OPEN' && (
              <Button
                className="w-full"
                onClick={() => updateStatus('IN_PROGRESS')}
                disabled={loading}
              >
                <Clock className="mr-2 h-4 w-4" />
                Iniciar Trabajo
              </Button>
            )}
            {workOrder.status === 'IN_PROGRESS' && (
              <>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus('ON_HOLD')}
                  disabled={loading}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </Button>
                <Button
                  className="w-full"
                  onClick={() => updateStatus('CLOSED')}
                  disabled={loading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completar
                </Button>
              </>
            )}
            {workOrder.status === 'ON_HOLD' && (
              <Button
                className="w-full"
                onClick={() => updateStatus('IN_PROGRESS')}
                disabled={loading}
              >
                <Clock className="mr-2 h-4 w-4" />
                Reanudar
              </Button>
            )}
            {workOrder.status === 'CLOSED' && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => updateStatus('OPEN')}
                disabled={loading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reabrir
              </Button>
            )}
            <Button variant="outline" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              Editar Orden
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGeneratePDF}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Task Plan SOP Protocol Execution Section */}
      {plan && (
        <Card className="border-2 border-primary/30 shadow-md">
          <CardHeader className="bg-primary/5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Pauta Técnica de Mantenimiento / SOP</CardTitle>
                <p className="text-xs text-muted-foreground">{plan.title} ({plan.frequency})</p>
              </div>
            </div>
            <Link href={`/dashboard/procedures/${plan.id}/edit`}>
              <Button variant="ghost" size="sm" className="text-xs">
                Ver Pauta Maestra
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Pre-Work Safety & Tools Banner */}
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isLoto
                    ? 'bg-destructive/10 border-destructive/40 text-destructive'
                    : 'bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isLoto ? 'bg-destructive text-white' : 'bg-green-600 text-white'
                    }`}
                  >
                    {isLoto ? <ShieldAlert className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {isLoto
                        ? '🛑 REQUISITO LOTO: MÁQUINA PARADA Y CONSIGNADA'
                        : '🟢 INSPECCIÓN EN MARCHA (EQUIPO EN OPERACIÓN)'}
                    </h4>
                    <p className="text-xs opacity-90">
                      {isLoto
                        ? 'Bloquear energía principal y purgar presiones antes de retirar protecciones.'
                        : 'Utilizar EPP reglamentario y mantener precaución con partes móviles.'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 bg-background rounded-full border text-foreground w-fit">
                  ⏱️ Duración: {plan.estimatedMinutes} min | Perfil: {plan.requiredSkill}
                </span>
              </div>

              {/* Tools & Safety Checklist Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-card space-y-1.5">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> EPP Requerido:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plan.safetyEquipment && plan.safetyEquipment.length > 0 ? (
                      plan.safetyEquipment.map((epp, idx) => (
                        <Badge key={idx} variant="warning" className="text-[10px]">
                          {epp}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">EPP estándar.</span>
                    )}
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-card space-y-1.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" /> Herramientas Necesarias:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plan.tools && plan.tools.length > 0 ? (
                      plan.tools.map((tool, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">
                          🔧 {tool}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Herramientas estándar.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Low-Stock Warning Banner */}
            {lowStockMaterials && lowStockMaterials.length > 0 && (
              <div className="p-3.5 border-2 border-destructive/60 bg-destructive/10 rounded-xl space-y-1.5 text-xs text-destructive">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Alerta de Almacén: Stock Insuficiente para esta Pauta</span>
                </div>
                <p className="pl-6">
                  Se requieren los siguientes repuestos que exceden el stock disponible actual:
                </p>
                <div className="pl-6 font-mono font-semibold">
                  {lowStockMaterials.map((m, i) => (
                    <div key={i}>
                      • {m.materialName} ({m.part?.code}): Requerido {m.quantity} {m.unit} | Disponible: {m.part?.stock} {m.part?.unit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Step Execution Checklist */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <CheckSquare className="w-4 h-4 text-primary" /> Secuencia de Pasos y Verificación Técnica:
              </h4>

              <div className="space-y-2.5">
                {plan.steps && plan.steps.length > 0 ? (
                  plan.steps.map((step) => {
                    const isChecked = !!completedSteps[step.id]
                    return (
                      <div
                        key={step.id}
                        onClick={() => toggleStep(step.id)}
                        className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'bg-green-500/10 border-green-500/50 text-foreground'
                            : 'bg-card border-border hover:border-primary/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by div onClick
                          className="mt-1 rounded h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                        />

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isChecked ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                              Paso #{step.stepNumber}
                            </span>
                            {step.referenceVal && (
                              <span className="text-[11px] font-mono bg-muted/80 px-2 py-0.5 rounded border text-muted-foreground">
                                🎯 Ref: <strong className="text-foreground">{step.referenceVal}</strong>
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isChecked ? 'line-through opacity-75 font-normal' : 'font-medium'}`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sin pasos registrados.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repuestos Utilizados */}
      <Card>
        <CardHeader>
          <CardTitle>Repuestos Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrder.partsUsed.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium">
                        Repuesto
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Código
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        Cantidad
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        Precio Unit.
                      </th>
                      <th className="p-3 text-right text-sm font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.partsUsed.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 text-sm">{item.part.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {item.part.code}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {formatCurrency(item.part.price)}
                        </td>
                        <td className="p-3 text-sm text-right font-medium">
                          {formatCurrency(item.part.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No se han registrado repuestos utilizados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Costos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Costo de Repuestos</span>
              <span className="font-medium">{formatCurrency(totalPartsCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Mano de Obra ({workOrder.laborHours || 0}h × $150)
              </span>
              <span className="font-medium">{formatCurrency(laborCost)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>Total</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
