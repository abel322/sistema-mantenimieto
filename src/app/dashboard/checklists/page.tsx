'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { ChecklistExecution } from '@/types/checklists'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ExecutionDetailModal } from '@/components/checklists/execution-detail-modal'
import { EditInspectionModal } from '@/components/checklists/edit-inspection-modal'
import { deleteChecklistExecution } from '@/app/actions/checklists'
import { 
  ClipboardCheck, 
  Plus, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Wrench, 
  Calendar, 
  Eye, 
  RefreshCw,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function ChecklistsDashboardPage() {
  const [executions, setExecutions] = useState<ChecklistExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null)
  
  // Edit & Delete states
  const [editingExecution, setEditingExecution] = useState<ChecklistExecution | null>(null)
  const [deletingExecution, setDeletingExecution] = useState<ChecklistExecution | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchExecutions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checklists/executions')
      if (res.ok) {
        const data = await res.json()
        setExecutions(data)
      }
    } catch (err) {
      console.error('Error fetching executions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExecutions()
  }, [])

  const confirmDeleteExecution = async () => {
    if (!deletingExecution) return
    setIsDeleting(true)
    try {
      const res = await deleteChecklistExecution(deletingExecution.id)
      if (res.success) {
        setToastMessage({ type: 'success', text: 'Inspección eliminada correctamente.' })
        setDeletingExecution(null)
        fetchExecutions()
      } else {
        // Fallback to API route
        const apiRes = await fetch(`/api/checklists/executions/${deletingExecution.id}`, {
          method: 'DELETE',
        })
        if (apiRes.ok) {
          setToastMessage({ type: 'success', text: 'Inspección eliminada correctamente.' })
          setDeletingExecution(null)
          fetchExecutions()
        } else {
          setToastMessage({ type: 'error', text: 'Error al eliminar la inspección.' })
        }
      }
    } catch (err) {
      console.error('Error deleting execution:', err)
      setToastMessage({ type: 'error', text: 'Error al procesar la eliminación.' })
    } finally {
      setIsDeleting(false)
    }
  }

  // Stats calculation
  const totalExecutions = executions.length
  const passedCount = executions.filter((e) => e.status === 'PASSED').length
  const failedCount = executions.filter((e) => e.status === 'FAILED' || e.status === 'FLAGGED').length
  const autoWorkOrdersCount = executions.reduce(
    (acc, curr) => acc + (curr.workOrders?.length || 0),
    0
  )

  // Filtered executions list
  const filteredExecutions = executions.filter((item) => {
    const matchesSearch =
      item.asset?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.asset?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.template?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.technician?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <Badge variant="success" className="flex items-center gap-1 text-xs">
            <CheckCircle className="w-3.5 h-3.5" /> Conforme
          </Badge>
        )
      case 'FLAGGED':
        return (
          <Badge variant="warning" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Observado
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
            <XCircle className="w-3.5 h-3.5" /> No Conforme
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-6 w-full max-w-full overflow-hidden">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 md:h-8 md:w-8 text-primary" /> Inspecciones & Checklists
          </h2>
          <p className="text-muted-foreground text-sm">
            Control de calidad y mantenimientos rutinarios en activos de planta.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link href="/dashboard/checklists/templates" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px] h-11 font-medium">
              <Settings className="mr-2 h-4 w-4" />
              Gestionar Plantillas
            </Button>
          </Link>

          <Link href="/dashboard/checklists/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px] h-11 font-medium shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Inspección
            </Button>
          </Link>
        </div>
      </div>

      {/* User Feedback Toast Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-destructive/15 text-destructive border-destructive/30'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          }`}
        >
          <span>{toastMessage.text}</span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setToastMessage(null)}>
            Entendido
          </Button>
        </div>
      )}

      {/* Overview Stat Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Inspecciones</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalExecutions}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Ejecutadas en planta</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Conformes (PASSED)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{passedCount}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Sin anomalías</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Con Fallas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive">{failedCount}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Atención técnica</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">OTs Generadas</CardTitle>
            <Wrench className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{autoWorkOrdersCount}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Correctivas auto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card className="shadow-sm w-full max-w-full">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por activo, código, plantilla o técnico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full min-h-[44px] h-11"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 min-h-[44px] h-11"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PASSED">Conformes (PASSED)</option>
                <option value="FAILED">No Conformes (FAILED)</option>
                <option value="FLAGGED">Observados (FLAGGED)</option>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={fetchExecutions}
                className="min-h-[44px] min-w-[44px] h-11 w-11 shrink-0"
                title="Recargar"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* MOBILE CARD VIEW (block md:hidden) */}
          <div className="block md:hidden space-y-3 pt-2">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span>Cargando inspecciones...</span>
              </div>
            ) : filteredExecutions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
                No se encontraron inspecciones registradas.
              </div>
            ) : (
              filteredExecutions.map((execution) => (
                <Card key={execution.id} className="shadow-sm border hover:border-primary/40 transition-colors w-full max-w-full overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    {/* Header: Fecha/Hora & Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        {new Date(execution.completedAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="shrink-0">{getStatusBadge(execution.status)}</div>
                    </div>

                    {/* Body */}
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-bold text-base text-foreground leading-tight truncate">
                          {execution.asset?.name || 'Activo'}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {execution.asset?.code}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground truncate">
                        <span className="font-semibold text-foreground">Plantilla:</span>{' '}
                        {execution.template?.title || 'Inspección'}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Técnico:</span>{' '}
                        {execution.technician?.name || 'Técnico'}
                      </div>

                      {execution.workOrders && execution.workOrders.length > 0 && (
                        <div className="pt-1">
                          <Link href="/dashboard/work-orders">
                            <Badge
                              variant="destructive"
                              className="cursor-pointer hover:underline inline-flex items-center gap-1 text-xs"
                            >
                              <Wrench className="w-3 h-3" /> OT Automática Generada
                            </Badge>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Mobile Footer Actions */}
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold flex items-center gap-1"
                        onClick={() => setSelectedExecution(execution)}
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalle
                      </Button>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                          onClick={() => setEditingExecution(execution)}
                          title="Editar Inspección"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                          onClick={() => setDeletingExecution(execution)}
                          title="Eliminar Inspección"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW (hidden md:block) */}
          <div className="hidden md:block border rounded-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Activo</th>
                  <th className="p-3">Plantilla de Inspección</th>
                  <th className="p-3">Técnico</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">OT Vinculada</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Cargando inspecciones...
                    </td>
                  </tr>
                ) : filteredExecutions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No se encontraron inspecciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredExecutions.map((execution) => (
                    <tr key={execution.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {new Date(execution.completedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="p-3 font-semibold">
                        <div>{execution.asset?.name || 'Activo'}</div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {execution.asset?.code}
                        </span>
                      </td>

                      <td className="p-3 max-w-[220px] truncate">
                        {execution.template?.title || 'Inspección'}
                      </td>

                      <td className="p-3">{execution.technician?.name || 'Técnico'}</td>

                      <td className="p-3">{getStatusBadge(execution.status)}</td>

                      <td className="p-3">
                        {execution.workOrders && execution.workOrders.length > 0 ? (
                          <Link href="/dashboard/work-orders">
                            <Badge variant="destructive" className="cursor-pointer hover:underline flex items-center gap-1 w-fit">
                              <Wrench className="w-3 h-3" /> OT Automática
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                            onClick={() => setSelectedExecution(execution)}
                            title="Ver Detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                            onClick={() => setEditingExecution(execution)}
                            title="Editar Inspección"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                            onClick={() => setDeletingExecution(execution)}
                            title="Eliminar Inspección"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Execution Details Modal */}
      <ExecutionDetailModal
        execution={selectedExecution}
        onClose={() => setSelectedExecution(null)}
      />

      {/* Edit Inspection Modal */}
      <EditInspectionModal
        execution={editingExecution}
        isOpen={!!editingExecution}
        onClose={() => setEditingExecution(null)}
        onSuccess={(msg) => {
          setToastMessage({ type: 'success', text: msg || 'Registro de inspección actualizado.' })
          fetchExecutions()
        }}
      />

      {/* Delete Confirmation Alert Modal */}
      {deletingExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">¿Eliminar Registro de Inspección?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Deseas eliminar este registro de inspección para el activo{' '}
              <strong>"{deletingExecution.asset?.name}" ({deletingExecution.asset?.code})</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeletingExecution(null)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteExecution} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Eliminando...
                  </>
                ) : (
                  'Confirmar Eliminación'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
