'use client'

import { TaskPlan } from '@/types/procedures'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Clock, 
  ShieldAlert, 
  Wrench, 
  Box, 
  CheckSquare, 
  UserCheck, 
  Zap, 
  AlertTriangle,
  Edit3
} from 'lucide-react'
import Link from 'next/link'

interface ProcedureDetailModalProps {
  plan: TaskPlan | null
  onClose: () => void
}

export function ProcedureDetailModal({ plan, onClose }: ProcedureDetailModalProps) {
  if (!plan) return null

  const isLoto = plan.machineStatus === 'STOPPED_LOTO'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-xs">
                {plan.assetType}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {plan.frequency}
              </Badge>
            </div>
            <h3 className="text-xl font-bold">{plan.title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* LOTO / Machine Status Alert */}
          <div
            className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLoto
                ? 'bg-destructive/10 border-destructive/40 text-destructive'
                : 'bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  isLoto ? 'bg-destructive text-white' : 'bg-green-600 text-white'
                }`}
              >
                {isLoto ? <ShieldAlert className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-base">
                  {isLoto ? '🛑 MÁQUINA PARADA - CONSIGNACIÓN LOTO REQUERIDA' : '🟢 INSPECCIÓN EN MARCHA (EQUIPO EN OPERACIÓN)'}
                </h4>
                <p className="text-xs opacity-90">
                  {isLoto
                    ? 'Desconectar energía eléctrica, bloquear válvulas neumáticas y colocar tarjeta LOTO antes de intervenir.'
                    : 'Mantener distancia de seguridad y utilizar EPP adecuado durante las mediciones.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold self-end sm:self-center">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {plan.estimatedMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-4 h-4" /> {plan.requiredSkill}
              </span>
            </div>
          </div>

          {plan.description && (
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
              {plan.description}
            </p>
          )}

          {/* Safety Equipment & Required Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Safety Equipment (EPP) */}
            <Card className="border shadow-sm">
              <CardHeader className="py-3 px-4 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> EPP / Equipo de Seguridad Obligatorio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-wrap gap-1.5">
                {plan.safetyEquipment && plan.safetyEquipment.length > 0 ? (
                  plan.safetyEquipment.map((epp, i) => (
                    <Badge key={i} variant="warning" className="text-xs">
                      🛡️ {epp}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Sin EPP especial especificado.</span>
                )}
              </CardContent>
            </Card>

            {/* Tools */}
            <Card className="border shadow-sm">
              <CardHeader className="py-3 px-4 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-500" /> Herramientas Necesarias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-wrap gap-1.5">
                {plan.tools && plan.tools.length > 0 ? (
                  plan.tools.map((tool, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      🔧 {tool}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Herramientas estándar de mano.</span>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Materials / Consumables */}
          {plan.materials && plan.materials.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" /> Repuestos y Consumibles Requeridos:
              </h4>
              <div className="border rounded-lg divide-y bg-card text-sm">
                {plan.materials.map((mat, i) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{mat.materialName}</p>
                      {mat.part && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Código: {mat.part.code} | Stock disponible: {mat.part.stock} {mat.part.unit}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm bg-muted px-2.5 py-1 rounded">
                        {mat.quantity} {mat.unit}
                      </span>
                      {mat.part && mat.part.stock < mat.quantity && (
                        <Badge variant="destructive" className="text-[10px]">
                          ⚠️ Stock Insuficiente
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step by Step Protocol */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" /> Secuencia de Pasos & Referencias Técnicas:
            </h4>
            <div className="space-y-3">
              {plan.steps && plan.steps.length > 0 ? (
                plan.steps.map((step) => (
                  <div
                    key={step.id || step.stepNumber}
                    className="p-4 border rounded-xl bg-card space-y-1.5 relative border-l-4 border-l-primary"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Paso {step.stepNumber}
                      </span>
                      {step.isMandatory && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                          Obligatorio
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground">{step.description}</p>
                    {step.referenceVal && (
                      <div className="text-xs font-mono p-2 bg-muted/50 rounded text-muted-foreground flex items-center gap-1.5 border border-dashed">
                        <span>🎯 Referencia / Setpoint:</span>
                        <span className="font-bold text-foreground">{step.referenceVal}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">Sin pasos registrados.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t px-6 py-3 bg-muted/20 flex justify-between items-center">
          <Link href={`/dashboard/procedures/${plan.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit3 className="w-4 h-4 mr-1" /> Editar Pauta
            </Button>
          </Link>
          <Button variant="default" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
