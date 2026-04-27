import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatCurrency } from '@/lib/utils'
'use client'

import { ArrowLeft, AlertTriangle, Wrench, Calendar, FileText } from 'lucide-react'
import { generateAssetPDF } from '@/lib/pdf-generator'
import Link from 'next/link'
import type { Asset, WorkOrder, FailureLog, MaintenanceLog, Schedule, User } from '@prisma/client'

type AssetWithRelations = Asset & {
  workOrders: (WorkOrder & { technician: User })[]
  failureLogs: FailureLog[]
  maintenanceLogs: MaintenanceLog[]
  schedules: Schedule[]
}

interface AssetDetailProps {
  asset: AssetWithRelations
}

const areaLabels = {
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

const statusLabels = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  CLOSED: 'Cerrada',
}

export function AssetDetail({ asset }: AssetDetailProps) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{asset.name}</h2>
            <p className="text-muted-foreground">{asset.code}</p>
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
        </div>
      </div>

      {/* Información General */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areaLabels[asset.area]}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fallas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asset.failureLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalDowntime.toFixed(1)}h downtime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes de Trabajo
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asset.workOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              {asset.workOrders.filter((wo) => wo.status !== 'CLOSED').length}{' '}
              abiertas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Costo Total Mant.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMaintenanceCost)}
            </div>
            <p className="text-xs text-muted-foreground">Histórico</p>
          </CardContent>
        </Card>
      </div>

      {/* Descripción */}
      {asset.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{asset.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Programaciones Activas */}
      {asset.schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Programaciones de Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {asset.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{schedule.taskTemplate}</p>
                    <p className="text-xs text-muted-foreground">
                      Cada {schedule.frequencyDays} días
                    </p>
                  </div>
                  <Badge>
                    Próximo: {new Date(schedule.nextDueDate).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Órdenes de Trabajo */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Órdenes de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          {asset.workOrders.length > 0 ? (
            <div className="space-y-3">
              {asset.workOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/work-orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{order.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.technician.name} •{' '}
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <Badge variant={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay órdenes de trabajo registradas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historial de Fallas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Historial de Fallas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {asset.failureLogs.length > 0 ? (
            <div className="space-y-3">
              {asset.failureLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{log.symptom}</p>
                      {log.rootCause && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Causa raíz:</strong> {log.rootCause}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive">
                      {log.downtimeHours}h downtime
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reportado: {formatDateTime(log.reportedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay fallas registradas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
