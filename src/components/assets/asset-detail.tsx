'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { FailureLogModal } from '@/components/assets/failure-log-modal'
import { 
  ArrowLeft, 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  FileText, 
  Info, 
  History, 
  ClipboardCheck, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye 
} from 'lucide-react'
import { generateAssetPDF } from '@/lib/pdf-generator'
import Link from 'next/link'
import type { Asset, WorkOrder, FailureLog, MaintenanceLog, Schedule, User, PartOnOrder, Part } from '@prisma/client'

type ChecklistExecutionWithRelations = {
  id: string
  template?: { title: string } | null
  technician?: { name: string } | null
  status: string
  completedAt: Date | string
  workOrders?: { id: string; title: string }[]
}

type AssetWithRelations = Asset & {
  workOrders: (WorkOrder & { technician: User; partsUsed?: (PartOnOrder & { part: Part })[] })[]
  failureLogs: FailureLog[]
  maintenanceLogs: MaintenanceLog[]
  schedules: Schedule[]
  checklistExecutions?: ChecklistExecutionWithRelations[]
}

interface AssetDetailProps {
  asset: AssetWithRelations
}

const areaLabels: Record<string, string> = {
  EXTRUSION: 'Extrusión',
  PRINTING: 'Impresión',
  SEALING: 'Sellado/Corte',
  AUXILIARY: 'Servicios Auxiliares',
}

const criticalityColors = {
  1: 'secondary',
  2: 'warning',
  3: 'destructive',
} as const

const statusColors = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'secondary',
  CLOSED: 'success',
} as const

const statusLabels: Record<string, string> = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  CLOSED: 'Cerrada',
}

const typeLabels: Record<string, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
}

export function AssetDetail({ asset }: AssetDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'failures' | 'inspections'>('info')
  const [failureModalOpen, setFailureModalOpen] = useState(false)

  const totalDowntime = asset.failureLogs.reduce(
    (acc, log) => acc + log.downtimeHours,
    0
  )

  const totalMaintenanceCost = asset.maintenanceLogs.reduce(
    (acc, log) => acc + log.totalCost,
    0
  )

  async function handleGeneratePDF() {
    try {
      const doc = generateAssetPDF(asset)
      doc.save(`activo-${asset.code}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el reporte')
    }
  }

  const getChecklistBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" /> Conforme
          </Badge>
        )
      case 'FLAGGED':
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" /> Observado
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> No Conforme
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{asset.name}</h2>
            <p className="text-muted-foreground text-sm font-mono">{asset.code} • {areaLabels[asset.area] || asset.area}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={criticalityColors[asset.criticality as 1 | 2 | 3]}>
            Criticidad {asset.criticality}
          </Badge>

          <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
            <FileText className="mr-2 h-4 w-4" />
            Generar PDF
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setFailureModalOpen(true)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Registrar Falla / Evento
          </Button>
        </div>
      </div>

      {/* Tab Navigation Header */}
      <div className="border-b bg-background flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'info'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Info className="w-4 h-4" /> Información General
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4" /> Historial de Mantenimiento ({asset.workOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('failures')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'failures'
              ? 'border-destructive text-destructive bg-destructive/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-destructive" /> Registro de Fallas ({asset.failureLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('inspections')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'inspections'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Inspecciones ({asset.checklistExecutions?.length || 0})
        </button>
      </div>

      {/* Tab Content Body */}
      {/* TAB 1: INFORMACIÓN GENERAL */}
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Área de Producción</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{areaLabels[asset.area] || asset.area}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fallas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{asset.failureLogs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {totalDowntime.toFixed(1)}h tiempo de paro
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órdenes de Trabajo</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asset.workOrders.length}</div>
                <p className="text-xs text-muted-foreground">
                  {asset.workOrders.filter((wo) => wo.status !== 'CLOSED').length} abiertas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Total Mant.</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalMaintenanceCost)}
                </div>
                <p className="text-xs text-muted-foreground">Histórico acumulado</p>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {asset.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Descripción del Activo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{asset.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Active Maintenance Schedules */}
          {asset.schedules && asset.schedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Calendar className="h-5 w-5 text-primary" />
                  Programaciones de Mantenimiento Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {asset.schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between rounded-lg border p-3.5 bg-card"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{schedule.taskTemplate}</p>
                        <p className="text-xs text-muted-foreground">
                          Frecuencia: Cada {schedule.frequencyDays} días ({schedule.frequencyType})
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        Próximo: {new Date(schedule.nextDueDate).toLocaleDateString('es-ES')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: HISTORIAL DE MANTENIMIENTO */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Historial de Órdenes de Trabajo</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Registro completo de intervenciones correctivas, preventivas y predictivas en este activo.
                </p>
              </div>
              <Link href="/dashboard/work-orders/new">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nueva Orden
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {asset.workOrders && asset.workOrders.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Título de la Orden</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Técnico Asignado</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Costo Estimado</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {asset.workOrders.map((order) => {
                        const partsCost = order.partsUsed?.reduce((a, b) => a + (b.part.price * b.quantity), 0) || 0
                        const laborCost = (order.laborHours || 0) * 150
                        const totalOrderCost = partsCost + laborCost

                        return (
                          <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-xs whitespace-nowrap">
                              {formatDateTime(order.createdAt)}
                            </td>
                            <td className="p-3 font-semibold">
                              {order.title}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">
                                {typeLabels[order.type] || order.type}
                              </Badge>
                            </td>
                            <td className="p-3">{order.technician?.name || 'No asignado'}</td>
                            <td className="p-3">
                              <Badge variant={statusColors[order.status]}>
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {formatCurrency(totalOrderCost)}
                            </td>
                            <td className="p-3 text-right">
                              <Link href={`/dashboard/work-orders/${order.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4 mr-1" /> Ver Orden
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-md">
                  No hay órdenes de trabajo registradas para este activo.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: REGISTRO DE FALLAS */}
      {activeTab === 'failures' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Registro de Fallas y Paros no Programados
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Histórico de averías, causas raíz y horas de indisponibilidad reportadas en planta.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setFailureModalOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Registrar Falla / Evento
              </Button>
            </CardHeader>

            <CardContent>
              {asset.failureLogs && asset.failureLogs.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-3">Fecha Reportada</th>
                        <th className="p-3">Síntoma / Falla</th>
                        <th className="p-3">Causa Raíz / Acción</th>
                        <th className="p-3 text-right">Horas de Paro (Downtime)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {asset.failureLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs whitespace-nowrap">
                            {formatDateTime(log.reportedAt)}
                          </td>
                          <td className="p-3 font-semibold text-destructive">
                            {log.symptom}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {log.rootCause || 'En análisis / No especificada'}
                          </td>
                          <td className="p-3 text-right font-bold">
                            <Badge variant="destructive" className="font-mono text-xs">
                              {log.downtimeHours} h
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-md">
                  No hay eventos de falla registrados en este activo.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: INSPECCIONES & CHECKLISTS */}
      {activeTab === 'inspections' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" /> Historial de Inspecciones & Checklists
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Registros de rutinas preventivas ejecutadas en este activo por el equipo técnico.
                </p>
              </div>
              <Link href={`/dashboard/checklists/new?assetId=${asset.id}`}>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nueva Inspección
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {asset.checklistExecutions && asset.checklistExecutions.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-3">Fecha Completo</th>
                        <th className="p-3">Plantilla de Inspección</th>
                        <th className="p-3">Técnico</th>
                        <th className="p-3">Resultado</th>
                        <th className="p-3">OT Generada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {asset.checklistExecutions.map((execution) => (
                        <tr key={execution.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs whitespace-nowrap">
                            {formatDateTime(execution.completedAt)}
                          </td>
                          <td className="p-3 font-semibold">
                            {execution.template?.title || 'Inspección'}
                          </td>
                          <td className="p-3">{execution.technician?.name || 'Técnico'}</td>
                          <td className="p-3">{getChecklistBadge(execution.status)}</td>
                          <td className="p-3">
                            {execution.workOrders && execution.workOrders.length > 0 ? (
                              <Link href="/dashboard/work-orders">
                                <Badge variant="destructive" className="cursor-pointer hover:underline">
                                  ⚡ OT Generada
                                </Badge>
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-md">
                  No hay inspecciones registradas para este activo.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal to log failure events */}
      <FailureLogModal
        assetId={asset.id}
        assetName={asset.name}
        isOpen={failureModalOpen}
        onClose={() => setFailureModalOpen(false)}
        onSuccess={() => {
          router.refresh()
          setActiveTab('failures')
        }}
      />
    </div>
  )
}
