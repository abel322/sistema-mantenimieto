'use client'

import { useState, useEffect } from 'react'
import { ChecklistExecution } from '@/types/checklists'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ExecutionDetailModal } from '@/components/checklists/execution-detail-modal'
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
  RefreshCw 
} from 'lucide-react'
import Link from 'next/link'

export default function ChecklistsDashboardPage() {
  const [executions, setExecutions] = useState<ChecklistExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null)

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
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Conforme
          </Badge>
        )
      case 'FLAGGED':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Observado
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> No Conforme
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-primary" /> Inspecciones & Checklists
          </h2>
          <p className="text-muted-foreground text-sm">
            Control de calidad y mantenimientos rutinarios en activos de planta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/checklists/templates">
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              Gestionar Plantillas
            </Button>
          </Link>

          <Link href="/dashboard/checklists/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Inspección
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspecciones</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">Ejecutadas en planta</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformes (PASSED)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedCount}</div>
            <p className="text-xs text-muted-foreground">Sin anomalías detectadas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Fallas / Alertadas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Requieren atención técnica</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OTs Generadas</CardTitle>
            <Wrench className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{autoWorkOrdersCount}</div>
            <p className="text-xs text-muted-foreground">Correctivas automáticas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por activo, código, plantilla o técnico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PASSED">Conformes (PASSED)</option>
                <option value="FAILED">No Conformes (FAILED)</option>
                <option value="FLAGGED">Observados (FLAGGED)</option>
              </Select>

              <Button variant="outline" size="icon" onClick={fetchExecutions} title="Recargar">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Executions Table */}
          <div className="border rounded-md overflow-x-auto">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedExecution(execution)}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Ver Detalle
                        </Button>
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
    </div>
  )
}
