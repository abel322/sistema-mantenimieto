'use client'

import { useState, useEffect } from 'react'
import { TaskPlan } from '@/types/procedures'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ProcedureDetailModal } from '@/components/procedures/procedure-detail-modal'
import { 
  BookOpen, 
  Plus, 
  Search, 
  ShieldAlert, 
  Zap, 
  Clock, 
  UserCheck, 
  Eye, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Box, 
  CheckSquare 
} from 'lucide-react'
import Link from 'next/link'
import { PLANT_AREAS } from '@/lib/constants'

export default function ProceduresListPage() {
  const [plans, setPlans] = useState<TaskPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [assetTypeFilter, setAssetTypeFilter] = useState('ALL')
  const [frequencyFilter, setFrequencyFilter] = useState('ALL')
  const [selectedPlan, setSelectedPlan] = useState<TaskPlan | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/procedures')
      if (res.ok) {
        const data = await res.json()
        setPlans(data)
      }
    } catch (err) {
      console.error('Error fetching procedures:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta pauta técnica?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/procedures/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPlans()
      } else {
        alert('Error al eliminar la pauta técnica')
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Filter logic
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      plan.requiredSkill.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAsset = assetTypeFilter === 'ALL' || plan.assetType === assetTypeFilter
    const matchesFreq = frequencyFilter === 'ALL' || plan.frequency === frequencyFilter

    return matchesSearch && matchesAsset && matchesFreq
  })

  // Stats calculation
  const totalPlans = plans.length
  const lotoPlans = plans.filter((p) => p.machineStatus === 'STOPPED_LOTO').length
  const runningPlans = plans.filter((p) => p.machineStatus === 'RUNNING').length
  const avgMinutes = totalPlans > 0
    ? Math.round(plans.reduce((acc, curr) => acc + curr.estimatedMinutes, 0) / totalPlans)
    : 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" /> Pautas Técnicas y SOPs
          </h2>
          <p className="text-muted-foreground text-sm">
            Protocolos estandarizados de mantenimiento, consignación LOTO y listas de herramientas/EPP.
          </p>
        </div>

        <Link href="/dashboard/procedures/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nueva Pauta Técnica
          </Button>
        </Link>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procedimientos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans}</div>
            <p className="text-xs text-muted-foreground">Pautas maestras registradas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos LOTO</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lotoPlans}</div>
            <p className="text-xs text-muted-foreground">Máquina parada obligatoria</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas en Marcha</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{runningPlans}</div>
            <p className="text-xs text-muted-foreground">Inspecciones con equipo operando</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgMinutes} min</div>
            <p className="text-xs text-muted-foreground">Tiempo estimado por SOP</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search controls */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descripción o especialidad (ej. Mecánico, Electricista)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
              <Select
                value={assetTypeFilter}
                onChange={(e) => setAssetTypeFilter(e.target.value)}
                className="w-full md:w-56"
              >
                <option value="ALL">Todas las Áreas</option>
                {PLANT_AREAS.map((pa) => (
                  <option key={pa.value} value={pa.value}>
                    {pa.label}
                  </option>
                ))}
              </Select>

              <Select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="w-full md:w-44"
              >
                <option value="ALL">Todas Frecuencias</option>
                <option value="DIARIO">Diario</option>
                <option value="SEMANAL">Semanal</option>
                <option value="MENSUAL">Mensual</option>
                <option value="ANUAL">Anual</option>
              </Select>

              <Button variant="outline" size="icon" onClick={fetchPlans} title="Recargar">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              Cargando pautas técnicas...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border rounded-lg">
              No se encontraron pautas técnicas con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredPlans.map((plan) => {
                const isLoto = plan.machineStatus === 'STOPPED_LOTO'
                return (
                  <Card
                    key={plan.id}
                    className="flex flex-col justify-between border-2 hover:border-primary/50 transition-all shadow-sm group"
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={isLoto ? 'destructive' : 'success'}
                          className="flex items-center gap-1 font-semibold text-[11px]"
                        >
                          {isLoto ? (
                            <>
                              <ShieldAlert className="w-3 h-3" /> 🛑 Parada LOTO
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3" /> 🟢 En Marcha
                            </>
                          )}
                        </Badge>

                        <span className="text-xs font-semibold px-2 py-0.5 bg-muted rounded font-mono">
                          {plan.frequency}
                        </span>
                      </div>

                      <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                        {plan.title}
                      </CardTitle>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" /> {plan.estimatedMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-primary" /> {plan.requiredSkill}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-primary" /> {plan.steps?.length || 0} pasos
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* EPP & Tools Tags */}
                      <div className="space-y-2 border-t pt-3 text-xs">
                        {plan.safetyEquipment && plan.safetyEquipment.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-muted-foreground font-medium">EPP:</span>
                            {plan.safetyEquipment.map((epp, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300">
                                {epp}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {plan.materials && plan.materials.length > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Box className="w-3.5 h-3.5 text-primary" />
                            <span>{plan.materials.length} repuesto(s) consumible(s)</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 border-t pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Detalle
                        </Button>

                        <Link href={`/dashboard/procedures/${plan.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(plan.id)}
                          disabled={deletingId === plan.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Procedure Detail Modal */}
      <ProcedureDetailModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  )
}
