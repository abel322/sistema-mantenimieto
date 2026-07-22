'use client'

import { ChecklistExecution } from '@/types/checklists'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, CheckCircle, AlertTriangle, XCircle, Wrench, Calendar, User, Package } from 'lucide-react'
import Link from 'next/link'

interface ExecutionDetailModalProps {
  execution: ChecklistExecution | null
  onClose: () => void
}

export function ExecutionDetailModal({ execution, onClose }: ExecutionDetailModalProps) {
  if (!execution) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Conforme (PASSED)
          </Badge>
        )
      case 'FLAGGED':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Con Observación (FLAGGED)
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> No Conforme (FAILED)
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div>
            <h3 className="text-lg font-bold">Detalle de Inspección</h3>
            <p className="text-sm text-muted-foreground">
              {execution.template?.title || 'Inspección'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status & Overview Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-accent/40 border">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Activo Inspeccionado
              </span>
              <p className="font-semibold text-sm">
                {execution.asset?.name} ({execution.asset?.code})
              </p>
              <span className="text-xs text-muted-foreground">Área: {execution.asset?.area}</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Técnico Responsable
              </span>
              <p className="font-semibold text-sm">{execution.technician?.name || 'Técnico'}</p>
              <span className="text-xs text-muted-foreground">{execution.technician?.email}</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Fecha de Ejecución
              </span>
              <p className="font-semibold text-sm">
                {new Date(execution.completedAt).toLocaleString('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Resultado General</span>
              <div>{getStatusBadge(execution.status)}</div>
            </div>
          </div>

          {/* Auto-generated Work Order Notification */}
          {execution.workOrders && execution.workOrders.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-sm font-semibold text-destructive">
                    Orden de Trabajo Correctiva Generada
                  </CardTitle>
                </div>
                <Link href="/dashboard/work-orders">
                  <Button size="sm" variant="destructive">
                    Ver Orden de Trabajo
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="py-2 px-4 text-xs text-destructive/90 space-y-1">
                {execution.workOrders.map((wo) => (
                  <div key={wo.id} className="flex justify-between items-center font-medium">
                    <span>• {wo.title}</span>
                    <Badge variant="outline" className="border-destructive text-destructive bg-background">
                      {wo.priority} | {wo.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Checklist Responses List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-tight">Respuestas del Checklist:</h4>
            <div className="border rounded-md divide-y">
              {execution.responses && execution.responses.length > 0 ? (
                execution.responses.map((res) => (
                  <div
                    key={res.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm ${
                      res.isFlagged ? 'bg-destructive/10 border-l-4 border-l-destructive' : ''
                    }`}
                  >
                    <div className="space-y-0.5 flex-1">
                      <p className="font-medium">{res.item?.label || 'Ítem'}</p>
                      {res.item?.type === 'NUMERIC' && (
                        <p className="text-xs text-muted-foreground">
                          Rango permitido: [{res.item.minValue ?? '-∞'}, {res.item.maxValue ?? '+∞'}]
                        </p>
                      )}
                      {res.notes && (
                        <p className="text-xs italic text-muted-foreground">Nota: {res.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {res.item?.type === 'BOOLEAN' && (
                        <Badge variant={res.valueBoolean ? 'success' : 'destructive'}>
                          {res.valueBoolean ? 'OK' : 'NO OK'}
                        </Badge>
                      )}

                      {res.item?.type === 'NUMERIC' && (
                        <Badge
                          variant={res.isFlagged ? 'destructive' : 'secondary'}
                          className="font-mono text-xs"
                        >
                          {res.valueNumeric ?? 'N/A'}
                        </Badge>
                      )}

                      {res.item?.type === 'TEXT' && (
                        <span className="text-sm font-medium">{res.valueText || 'Sin respuesta'}</span>
                      )}

                      {res.isFlagged && (
                        <Badge variant="destructive" className="text-[10px]">
                          Falla Detectada
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Sin detalle de respuestas disponibles.
                </div>
              )}
            </div>
          </div>

          {/* Observations */}
          {execution.notes && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground">Observaciones Generales</h4>
              <p className="text-sm p-3 bg-muted rounded-md text-foreground">{execution.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t px-6 py-3 bg-muted/20 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
