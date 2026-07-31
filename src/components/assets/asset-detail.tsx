'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Toast, ToastMessage } from '@/components/ui/toast'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { FailureLogModal } from '@/components/assets/failure-log-modal'
import { EditFailureModal } from '@/components/assets/edit-failure-modal'
import { DeleteFailureModal } from '@/components/assets/delete-failure-modal'
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
  Eye,
  Pencil,
  Trash2,
  Box,
  Package,
  Timer,
  CheckCircle2,
  DollarSign,
  Cpu,
  Loader2,
  MoreVertical
} from 'lucide-react'
import { generateAssetPDF } from '@/lib/pdf-generator'
import { AssetEditModal } from '@/components/assets/asset-edit-modal'
import { AssetDeleteModal } from '@/components/assets/asset-delete-modal'
import Link from 'next/link'
import type { Asset, WorkOrder, FailureLog, MaintenanceLog, Schedule, User, PartOnOrder, Part, Supplier } from '@prisma/client'
import { getAreaLabel, getCriticalityBadge } from '@/lib/constants'

type WorkOrderMaterialWithRelation = {
  id?: string
  inventoryItemId?: string | null
  customName?: string | null
  isCustom?: boolean
  quantityUsed: number
  inventoryItem?: Part | null
}

type WorkOrderWithFullRelations = WorkOrder & {
  technician: User
  externalVendor?: Supplier | null
  materials?: WorkOrderMaterialWithRelation[]
  partsUsed?: (PartOnOrder & { part: Part })[]
}

type AssetWithRelations = Asset & {
  parts?: (Part & { preferredSupplier?: Supplier | null })[]
  workOrders: WorkOrderWithFullRelations[]
  failureLogs: FailureLog[]
  maintenanceLogs: MaintenanceLog[]
  schedules: Schedule[]
  checklistExecutions?: any[]
}

const statusColors: Record<string, any> = {
  OPEN: 'default',
  ABIERTA: 'default',
  IN_PROGRESS: 'warning',
  EN_PROCESO: 'warning',
  ON_HOLD: 'secondary',
  PAUSADA: 'secondary',
  PENDIENTE_REPUESTO: 'outline',
  CLOSED: 'success',
  FINALIZADA: 'success',
  CANCELADA: 'destructive',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Abierta',
  ABIERTA: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  EN_PROCESO: 'En Progreso',
  ON_HOLD: 'En Pausa',
  PAUSADA: 'Pausada',
  PENDIENTE_REPUESTO: 'Pendiente Repuesto',
  CLOSED: 'Finalizada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

const typeLabels: Record<string, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
}

const priorityColors: Record<string, any> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'destructive',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

interface ConsumedPartSummary {
  id: string
  code: string
  name: string
  unit: string
  totalQuantity: number
  unitPrice: number
  totalCost: number
  isCustom: boolean
  lastUsedDate: string | Date
}

export function AssetDetail({ asset }: AssetDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'failures' | 'critical_parts' | 'consumed_parts'>('info')
  const [failureModalOpen, setFailureModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [woFilter, setWoFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED' | 'CORRECTIVE' | 'PREVENTIVE'>('ALL')

  // Failure Log Edit / Delete states
  const [editingFailureLog, setEditingFailureLog] = useState<any | null>(null)
  const [deletingFailureLog, setDeletingFailureLog] = useState<any | null>(null)

  // Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Stock adjustment loading state
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null)

  // Total downtime hours
  const totalDowntime = useMemo(() => {
    return asset.failureLogs.reduce((acc, log) => acc + log.downtimeHours, 0)
  }, [asset.failureLogs])

  // Total labor hours across all work orders
  const totalLaborHours = useMemo(() => {
    return asset.workOrders.reduce((acc, wo) => acc + (wo.laborHours || 0), 0)
  }, [asset.workOrders])

  // Total cost across all work orders (parts + labor)
  const totalWOCost = useMemo(() => {
    return asset.workOrders.reduce((acc, wo) => {
      const partsCost = wo.partsUsed?.reduce((a, b) => a + (b.part.price * b.quantity), 0) || 0
      const matCost = wo.materials?.reduce((a, b) => a + ((b.inventoryItem?.price || 0) * b.quantityUsed), 0) || 0
      const laborCost = (wo.laborHours || 0) * 150
      return acc + partsCost + matCost + laborCost
    }, 0)
  }, [asset.workOrders])

  // Aggregate spare parts & materials consumed by this asset
  const consumedPartsList = useMemo(() => {
    const map = new Map<string, ConsumedPartSummary>()

    asset.workOrders.forEach((wo) => {
      const date = wo.closedAt || wo.completedAt || wo.createdAt

      // Process materials
      wo.materials?.forEach((mat) => {
        const key = mat.isCustom
          ? `custom-${mat.customName}`
          : (mat.inventoryItemId || `custom-${mat.customName}`)
        const name = mat.isCustom
          ? (mat.customName || 'Material Personalizado')
          : (mat.inventoryItem?.name || mat.customName || 'Material')
        const code = mat.isCustom ? 'PERSONALIZADO' : (mat.inventoryItem?.code || 'INV')
        const unit = mat.inventoryItem?.unit || 'unidad'
        const price = mat.inventoryItem?.price || 0
        const qty = mat.quantityUsed || 1
        const cost = qty * price

        if (map.has(key)) {
          const existing = map.get(key)!
          existing.totalQuantity += qty
          existing.totalCost += cost
          if (new Date(date) > new Date(existing.lastUsedDate)) {
            existing.lastUsedDate = date
          }
        } else {
          map.set(key, {
            id: key,
            code,
            name,
            unit,
            totalQuantity: qty,
            unitPrice: price,
            totalCost: cost,
            isCustom: !!mat.isCustom,
            lastUsedDate: date,
          })
        }
      })

      // Process partsUsed
      wo.partsUsed?.forEach((pu) => {
        const key = pu.partId || pu.part?.id || `part-${pu.id}`
        const name = pu.part?.name || 'Repuesto'
        const code = pu.part?.code || 'PARTE'
        const unit = pu.part?.unit || 'unidad'
        const price = pu.part?.price || 0
        const qty = pu.quantity || 1
        const cost = qty * price

        if (map.has(key)) {
          const existing = map.get(key)!
          existing.totalQuantity += qty
          existing.totalCost += cost
          if (new Date(date) > new Date(existing.lastUsedDate)) {
            existing.lastUsedDate = date
          }
        } else {
          map.set(key, {
            id: key,
            code,
            name,
            unit,
            totalQuantity: qty,
            unitPrice: price,
            totalCost: cost,
            isCustom: false,
            lastUsedDate: date,
          })
        }
      })
    })

    return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost)
  }, [asset.workOrders])

  // Total spare parts cost
  const totalPartsCostAcc = useMemo(() => {
    return consumedPartsList.reduce((acc, p) => acc + p.totalCost, 0)
  }, [consumedPartsList])

  // History Filter for Tab 2
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'WORK_ORDERS' | 'PREVENTIVE_ROUTINES'>('ALL')

  // Unified Completed Maintenance History (ONLY Completed Work Orders & Completed Routines/Checklists)
  const completedHistory = useMemo(() => {
    const items: Array<{
      id: string
      type: 'WORK_ORDER' | 'PREVENTIVE_ROUTINE'
      date: Date
      title: string
      description?: string | null
      orderType?: string
      status: string
      technicianName: string
      externalVendorName?: string | null
      laborHours?: number | null
      partsConsumed?: { name: string; quantity: number; unit: string; cost: number }[]
      totalCost?: number
      checklistScore?: string
      notes?: string | null
      workOrderId?: string
    }> = []

    // 1. Completed Work Orders (status === 'FINALIZADA' or 'CLOSED')
    asset.workOrders.forEach((wo) => {
      if (['FINALIZADA', 'CLOSED'].includes(wo.status)) {
        const partsCost = wo.partsUsed?.reduce((a, b) => a + (b.part.price * b.quantity), 0) || 0
        const matCost = wo.materials?.reduce((a, b) => a + ((b.inventoryItem?.price || 0) * b.quantityUsed), 0) || 0
        const laborCost = (wo.laborHours || 0) * 150
        const totalCost = partsCost + matCost + laborCost

        const consumed: { name: string; quantity: number; unit: string; cost: number }[] = []
        wo.partsUsed?.forEach((pu) => {
          consumed.push({
            name: pu.part?.name || 'Repuesto',
            quantity: pu.quantity,
            unit: pu.part?.unit || 'unidad',
            cost: (pu.part?.price || 0) * pu.quantity,
          })
        })
        wo.materials?.forEach((mat) => {
          const name = mat.isCustom ? (mat.customName || 'Material Especial') : (mat.inventoryItem?.name || 'Material')
          const price = mat.inventoryItem?.price || 0
          consumed.push({
            name,
            quantity: mat.quantityUsed,
            unit: mat.inventoryItem?.unit || 'unidad',
            cost: price * mat.quantityUsed,
          })
        })

        const date = new Date(wo.completedAt || wo.closedAt || wo.updatedAt || wo.createdAt)

        items.push({
          id: `wo-${wo.id}`,
          type: 'WORK_ORDER',
          date,
          title: wo.title,
          description: wo.description,
          orderType: wo.type,
          status: wo.status,
          technicianName: wo.technician?.name || 'Técnico Asignado',
          externalVendorName: wo.externalVendor?.name,
          laborHours: wo.laborHours,
          partsConsumed: consumed,
          totalCost,
          workOrderId: wo.id,
        })
      }
    })

    // 2. Completed Maintenance Schedule Routines / Checklist Executions
    if (asset.checklistExecutions && Array.isArray(asset.checklistExecutions)) {
      asset.checklistExecutions.forEach((ce: any) => {
        if (ce.completedAt || ['PASSED', 'FLAGGED', 'COMPLETADO', 'FINALIZADA'].includes(ce.status)) {
          const totalItems = ce.template?.items?.length || ce.responses?.length || 0
          const passedItems = ce.responses?.filter((r: any) => r.valueBoolean === true || r.isFlagged === false)?.length || totalItems
          const scoreStr = totalItems > 0 ? `${passedItems}/${totalItems} ítems verificados (100% Ok)` : 'Rutina Ejecutada'

          const date = new Date(ce.completedAt || ce.createdAt)

          items.push({
            id: `ce-${ce.id}`,
            type: 'PREVENTIVE_ROUTINE',
            date,
            title: ce.template?.title || 'Rutina de Mantenimiento Preventivo',
            description: ce.template?.description,
            status: ce.status,
            technicianName: ce.technician?.name || 'Técnico de Mantenimiento',
            checklistScore: scoreStr,
            notes: ce.notes,
          })
        }
      })
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [asset.workOrders, asset.checklistExecutions])

  const filteredCompletedHistory = useMemo(() => {
    return completedHistory.filter((item) => {
      if (historyFilter === 'WORK_ORDERS') return item.type === 'WORK_ORDER'
      if (historyFilter === 'PREVENTIVE_ROUTINES') return item.type === 'PREVENTIVE_ROUTINE'
      return true
    })
  }, [completedHistory, historyFilter])

  const handleQuickStockAdd = async (partId: string) => {
    setUpdatingStockId(partId)
    try {
      const res = await fetch(`/api/inventory/${partId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment: 1 }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding stock:', error)
    } finally {
      setUpdatingStockId(null)
    }
  }

  const handleFailureEditSuccess = () => {
    setToast({
      id: Date.now().toString(),
      title: 'Éxito',
      description: 'Registro de falla actualizado correctamente.',
      type: 'success',
    })
    router.refresh()
  }

  const handleFailureDeleteSuccess = () => {
    setToast({
      id: Date.now().toString(),
      title: 'Éxito',
      description: 'Registro de falla eliminado del historial.',
      type: 'success',
    })
    router.refresh()
  }

  async function handleGeneratePDF() {
    try {
      const doc = generateAssetPDF(asset)
      doc.save(`hoja-de-vida-${asset.code}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar la Hoja de Vida PDF')
    }
  }

  const assignedParts = asset.parts || []

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href="/dashboard/assets">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">{asset.name}</h2>
              {(() => {
                const badgeInfo = getCriticalityBadge(asset.criticality)
                return <Badge className={`${badgeInfo.className} text-xs shrink-0`}>{badgeInfo.label}</Badge>
              })()}
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm font-mono truncate">
              Código: <strong className="text-foreground">{asset.code}</strong> • Área: {getAreaLabel(asset.area)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)} className="flex-1 sm:flex-none text-xs">
            <Pencil className="mr-1.5 h-4 w-4 text-blue-500" />
            Editar
          </Button>

          <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="flex-1 sm:flex-none text-xs">
            <FileText className="mr-1.5 h-4 w-4" />
            Hoja de Vida PDF
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setFailureModalOpen(true)}
            className="w-full sm:w-auto text-xs"
          >
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Registrar Falla
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteModalOpen(true)}
            title="Eliminar Activo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Bar Navigation (Scrollable on Mobile) */}
      <div className="border-b bg-card w-full max-w-full overflow-x-auto flex items-center gap-1 sm:gap-2 pb-1 no-scrollbar border-border">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'info'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <span>📊 Información General</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'history'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>📜 Historial de Mantenimiento ({completedHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('failures')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'failures'
              ? 'border-destructive text-destructive bg-destructive/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span>⚠️ Registros de Falla ({asset.failureLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('critical_parts')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'critical_parts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Box className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>📦 Repuestos Críticos ({assignedParts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('consumed_parts')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'consumed_parts'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>📈 Consumo Histórico ({consumedPartsList.length})</span>
        </button>
      </div>

      {/* TAB 1: INFORMACIÓN GENERAL */}
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Área de Producción</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{getAreaLabel(asset.area)}</div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fallas Registradas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-destructive">{asset.failureLogs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {totalDowntime.toFixed(1)}h acumuladas de paro
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órdenes de Trabajo</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{asset.workOrders.length}</div>
                <p className="text-xs text-muted-foreground">
                  {asset.workOrders.filter((wo) => !['CLOSED', 'FINALIZADA', 'CANCELADA'].includes(wo.status)).length} activas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Total Mant.</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalWOCost)}
                </div>
                <p className="text-xs text-muted-foreground">Repuestos + Mano de obra</p>
              </CardContent>
            </Card>
          </div>

          {/* Description & Technical Specs */}
          {asset.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Especificaciones / Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{asset.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Maintenance Schedules */}
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3.5 bg-card gap-2"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{schedule.taskTemplate}</p>
                        <p className="text-xs text-muted-foreground">
                          Frecuencia: Cada {schedule.frequencyDays} días ({schedule.frequencyType})
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs w-fit">
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

      {/* TAB 2: HISTORIAL DE MANTENIMIENTO FINALIZADO */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Key Metrics Bar */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Históricos Finalizados</p>
                  <p className="text-2xl font-bold mt-1">{completedHistory.length}</p>
                </div>
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                  <History className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Órdenes de Trabajo Cerradas</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {completedHistory.filter((i) => i.type === 'WORK_ORDER').length}
                  </p>
                </div>
                <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                  <Wrench className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rutinas Preventivas Ejecutadas</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {completedHistory.filter((i) => i.type === 'PREVENTIVE_ROUTINE').length}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Card & Filter Header */}
          <Card>
            <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary shrink-0" />
                  Historial de Mantenimientos Finalizados
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Línea de tiempo cronológica exclusiva de eventos de mantenimiento completados para {asset.name}.
                </p>
              </div>

              <Link href={`/dashboard/work-orders/new?assetId=${asset.id}`}>
                <Button size="sm" className="w-full sm:w-auto text-xs font-semibold gap-1.5 shadow-sm">
                  <Plus className="w-4 h-4" />
                  + Nueva OT para este Activo
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Button
                  variant={historyFilter === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('ALL')}
                  className="text-xs h-8 px-3 font-medium"
                >
                  Todos los Finalizados ({completedHistory.length})
                </Button>

                <Button
                  variant={historyFilter === 'WORK_ORDERS' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('WORK_ORDERS')}
                  className="text-xs h-8 px-3 font-medium border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400"
                >
                  🛠️ Órdenes de Trabajo ({completedHistory.filter((i) => i.type === 'WORK_ORDER').length})
                </Button>

                <Button
                  variant={historyFilter === 'PREVENTIVE_ROUTINES' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('PREVENTIVE_ROUTINES')}
                  className="text-xs h-8 px-3 font-medium border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"
                >
                  📅 Programas Preventivos ({completedHistory.filter((i) => i.type === 'PREVENTIVE_ROUTINE').length})
                </Button>
              </div>

              {/* Timeline Container */}
              {filteredCompletedHistory.length > 0 ? (
                <div className="relative pl-4 sm:pl-6 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {filteredCompletedHistory.map((item) => {
                    const isWorkOrder = item.type === 'WORK_ORDER'

                    return (
                      <div key={item.id} className="relative group">
                        {/* Timeline Bullet Node */}
                        <div
                          className={`absolute -left-[21px] sm:-left-[25px] top-4 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center transition-transform group-hover:scale-110 ${
                            isWorkOrder
                              ? 'border-indigo-500 text-indigo-500'
                              : 'border-emerald-500 text-emerald-500'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isWorkOrder ? 'bg-indigo-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>

                        {/* History Entry Card */}
                        <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all space-y-3">
                          {/* Entry Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Source Tag Badge */}
                              {isWorkOrder ? (
                                <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30 text-xs font-bold px-2.5 py-0.5 flex items-center gap-1.5">
                                  <span>🛠️ OT: {typeLabels[item.orderType || 'CORRECTIVE'] || item.orderType}</span>
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-0.5 flex items-center gap-1.5">
                                  <span>📅 Programa Preventivo</span>
                                </Badge>
                              )}

                              <h4 className="font-bold text-sm sm:text-base text-foreground">
                                {item.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{formatDateTime(item.date)}</span>
                            </div>
                          </div>

                          {/* Description / Summary */}
                          {item.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                              {item.description}
                            </p>
                          )}

                          {/* Specific Entry Details */}
                          {isWorkOrder ? (
                            <div className="space-y-2 pt-1 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground font-medium">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span>
                                    <strong>Técnico:</strong> {item.technicianName}
                                  </span>
                                  {item.externalVendorName && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        <strong>Proveedor:</strong> {item.externalVendorName}
                                      </span>
                                    </>
                                  )}
                                  {item.laborHours ? (
                                    <>
                                      <span>•</span>
                                      <span>
                                        <strong>Mano de Obra:</strong> {item.laborHours} h
                                      </span>
                                    </>
                                  ) : null}
                                </div>

                                {item.totalCost !== undefined && item.totalCost > 0 && (
                                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                    {formatCurrency(item.totalCost)}
                                  </span>
                                )}
                              </div>

                              {/* Consumed Materials / Parts */}
                              {item.partsConsumed && item.partsConsumed.length > 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                  <span className="text-[11px] font-semibold text-muted-foreground block">
                                    📦 Insumos / Repuestos Utilizados:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.partsConsumed.map((part, pIdx) => (
                                      <Badge
                                        key={pIdx}
                                        variant="secondary"
                                        className="text-[11px] font-mono py-0.5 px-2 bg-slate-100 dark:bg-slate-800 text-foreground border"
                                      >
                                        {part.name} × {part.quantity} {part.unit}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Footer Action */}
                              <div className="pt-2 flex justify-end">
                                <Link href={`/dashboard/work-orders/${item.workOrderId}`}>
                                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                                    <Eye className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                                    Ver Ficha Completa / PDF
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ) : (
                            /* Preventive Routine Execution Details */
                            <div className="space-y-2 pt-1 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/20">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {item.checklistScore}
                                  </span>
                                  <p className="text-[11px] text-muted-foreground">
                                    Técnico Evaluador: <strong>{item.technicianName}</strong>
                                  </p>
                                </div>

                                <Badge variant="success" className="text-xs">
                                  ✓ Mantenimiento Completado
                                </Badge>
                              </div>

                              {item.notes && (
                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 italic text-xs">
                                  💬 <strong>Observaciones:</strong> {item.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Empty State when no completed records exist */
                <div className="p-10 text-center text-muted-foreground border border-dashed rounded-xl space-y-3 bg-muted/20 my-4">
                  <History className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-base font-bold text-foreground">
                    No hay mantenimientos ni órdenes de trabajo finalizadas registradas para este activo aún.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Las órdenes de trabajo cerradas y las rutinas preventivas ejecutadas aparecerán automáticamente en esta línea de tiempo para control de auditoría.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: HISTORIAL DE FALLAS REGISTRADAS */}
      {activeTab === 'failures' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Key Failure Metrics */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Eventos de Falla</p>
                  <p className="text-2xl font-bold text-destructive mt-1">{asset.failureLogs.length}</p>
                </div>
                <div className="p-2.5 bg-destructive/10 text-destructive rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horas Totales de Paro</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{totalDowntime.toFixed(1)} h</p>
                </div>
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-lg">
                  <Timer className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paro Promedio / Falla</p>
                  <p className="text-2xl font-bold mt-1">
                    {asset.failureLogs.length > 0
                      ? `${(totalDowntime / asset.failureLogs.length).toFixed(1)} h`
                      : '0 h'}
                  </p>
                </div>
                <div className="p-2.5 bg-muted text-muted-foreground rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Failure Logs List */}
          <Card>
            <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5 shrink-0" /> Log de Averías & Eventos de Paro
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Bitácora de fallas mecánicas, eléctricas o operativas registradas en esta máquina.
                </p>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setFailureModalOpen(true)}
                className="w-full sm:w-auto text-xs font-semibold shadow-sm"
              >
                <AlertTriangle className="mr-1.5 h-4 w-4" />
                Registrar Falla / Evento
              </Button>
            </CardHeader>

            <CardContent className="p-4">
              {asset.failureLogs && asset.failureLogs.length > 0 ? (
                <div className="space-y-3">
                  {asset.failureLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg bg-card space-y-2 border-red-500/20 shadow-sm relative group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="destructive" className="font-mono text-xs shrink-0">
                            {log.downtimeHours}h Paro
                          </Badge>
                          <h4 className="font-bold text-sm text-foreground truncate" title={log.symptom}>
                            {log.symptom}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <span className="text-xs font-mono text-muted-foreground">
                            {formatDateTime(log.reportedAt)}
                          </span>

                          {/* Action Buttons: Edit and Delete with touch target size h-8 w-8 */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-md"
                              onClick={() => setEditingFailureLog(log)}
                              title="Editar Falla"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-md"
                              onClick={() => setDeletingFailureLog(log)}
                              title="Eliminar Falla"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Causa Raíz / Acción:</strong>{' '}
                        {log.rootCause || 'En análisis o no especificada.'}
                      </p>

                      {log.resolvedAt && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Resuelto el {formatDateTime(log.resolvedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  No hay eventos de falla registrados en este activo.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: REPUESTOS CRÍTICOS Y ASIGNADOS */}
      {activeTab === 'critical_parts' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card>
            <CardHeader className="p-4 pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Box className="h-5 w-5 shrink-0" /> Repuestos Críticos & Refacciones Asignadas
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Catálogo de repuestos mapeados directamente a {asset.name} para prevención de paros de planta.
                </p>
              </div>

              <Link href="/dashboard/inventory/new">
                <Button size="sm" className="w-full sm:w-auto text-xs font-semibold shadow-sm">
                  <Plus className="w-4 h-4 mr-1.5" /> + Asignar / Nuevo Repuesto
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4">
              {assignedParts.length > 0 ? (
                <div className="border rounded-md w-full max-w-full overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-3">TAG / Código</th>
                        <th className="p-3">Nombre del Repuesto</th>
                        <th className="p-3 text-center">Stock Actual</th>
                        <th className="p-3 text-center">Stock Mínimo</th>
                        <th className="p-3 text-right">Precio Unitario</th>
                        <th className="p-3 text-center">Estado del Stock</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assignedParts.map((part) => {
                        const isAvailable = part.stock > part.minStock

                        return (
                          <tr key={part.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-xs font-bold text-primary">
                              <Link href={`/dashboard/inventory/${part.id}`} className="hover:underline">
                                {part.code}
                              </Link>
                            </td>
                            <td className="p-3 font-semibold">
                              <Link href={`/dashboard/inventory/${part.id}`} className="hover:text-primary">
                                {part.name}
                              </Link>
                              {part.category && (
                                <p className="text-[11px] font-normal text-muted-foreground">{part.category}</p>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-sm">
                              {part.stock} {part.unit}
                            </td>
                            <td className="p-3 text-center font-mono text-xs text-muted-foreground">
                              {part.minStock} {part.unit}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {formatCurrency(part.price)}
                            </td>
                            <td className="p-3 text-center">
                              {isAvailable ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2 py-0.5">
                                  🟢 Stock Disponible
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs font-semibold px-2 py-0.5 animate-pulse">
                                  🔴 Stock Crítico (Falta Repuesto)
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 px-2.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 font-semibold"
                                disabled={updatingStockId === part.id}
                                onClick={() => handleQuickStockAdd(part.id)}
                                title="Añadir 1 unidad al stock"
                              >
                                {updatingStockId === part.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5 mr-1" /> + Registrar Entrada / Pedido
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground border border-dashed rounded-lg space-y-3">
                  <Box className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm font-semibold">
                    No hay repuestos críticos vinculados directamente a {asset.name}.
                  </p>
                  <p className="text-xs max-w-sm mx-auto">
                    Asigna o edita un repuesto en la sección de Inventario seleccionando este activo en la casilla "Activos / Máquinas Compatibles".
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: CONSUMO HISTÓRICO ACUMULADO */}
      {activeTab === 'consumed_parts' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Key Spare Parts Metrics */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ítems Diferentes Usados</p>
                  <p className="text-2xl font-bold mt-1">{consumedPartsList.length}</p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Box className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unidades Totales Consumidas</p>
                  <p className="text-2xl font-bold mt-1">
                    {consumedPartsList.reduce((acc, p) => acc + p.totalQuantity, 0)}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gasto Total en Repuestos</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(totalPartsCostAcc)}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consumed Spare Parts Summary Table */}
          <Card>
            <CardHeader className="p-4 pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-500 shrink-0" /> Consumo Acumulado de Repuestos & Insumos
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Consolidado de materiales y refacciones utilizadas durante los mantenimientos de este activo.
              </p>
            </CardHeader>

            <CardContent className="p-4">
              {consumedPartsList.length > 0 ? (
                <div className="border rounded-md w-full max-w-full overflow-x-auto">
                  <table className="w-full min-w-[650px] text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Descripción del Repuesto / Insumo</th>
                        <th className="p-3 text-center">Cantidad Consumida</th>
                        <th className="p-3 text-right">Precio Unitario</th>
                        <th className="p-3 text-right">Costo Acumulado</th>
                        <th className="p-3 text-right">Último Consumo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {consumedPartsList.map((part) => (
                        <tr key={part.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs font-bold text-primary">
                            {part.code}
                          </td>
                          <td className="p-3 font-semibold">
                            {part.name}
                            {part.isCustom && (
                              <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1">
                                Especial
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {part.totalQuantity} {part.unit}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {part.unitPrice > 0 ? formatCurrency(part.unitPrice) : 'N/A'}
                          </td>
                          <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(part.totalCost)}
                          </td>
                          <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                            {formatDateTime(part.lastUsedDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  No se han registrado repuestos o materiales consumidos en este activo.
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

      {/* Modal to Edit failure events */}
      {editingFailureLog && (
        <EditFailureModal
          isOpen={!!editingFailureLog}
          failureLog={editingFailureLog}
          onClose={() => setEditingFailureLog(null)}
          onSuccess={handleFailureEditSuccess}
        />
      )}

      {/* Modal to Delete failure events */}
      {deletingFailureLog && (
        <DeleteFailureModal
          isOpen={!!deletingFailureLog}
          failureLog={deletingFailureLog}
          onClose={() => setDeletingFailureLog(null)}
          onSuccess={handleFailureDeleteSuccess}
        />
      )}

      {/* Edit Asset Modal */}
      <AssetEditModal
        isOpen={editModalOpen}
        asset={asset}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Delete Confirmation Modal */}
      <AssetDeleteModal
        isOpen={deleteModalOpen}
        asset={asset}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={() => {
          router.push('/dashboard/assets')
          router.refresh()
        }}
      />
    </div>
  )
}
