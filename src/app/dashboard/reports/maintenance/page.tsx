'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { generateMaintenanceReportPDF } from '@/lib/pdf-generator'

export default function MaintenanceReportPage() {
  const [loading, setLoading] = useState(false)

  async function handleGeneratePDF() {
    setLoading(true)
    try {
      // Obtener datos del dashboard
      const response = await fetch('/api/reports/maintenance')
      const data = await response.json()

      // Generar PDF
      const doc = generateMaintenanceReportPDF(data)
      
      // Descargar
      doc.save(`reporte-mantenimiento-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Reporte General de Mantenimiento
          </h2>
          <p className="text-muted-foreground">
            Genera un reporte completo con KPIs y estadísticas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contenido del Reporte</CardTitle>
          <CardDescription>
            Este reporte incluye la siguiente información:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Indicadores clave (KPIs): Órdenes abiertas, MTTR, activos totales</li>
            <li>Porcentaje de Mantenimiento Preventivo (PMP)</li>
            <li>Distribución de mantenimiento (Preventivo, Correctivo, Predictivo)</li>
            <li>Top 5 fallas (Análisis de Pareto)</li>
            <li>Órdenes de trabajo recientes</li>
            <li>Alertas de stock bajo</li>
          </ul>

          <div className="pt-4">
            <Button
              onClick={handleGeneratePDF}
              disabled={loading}
              className="gap-2"
              size="lg"
            >
              <Download className="h-5 w-5" />
              {loading ? 'Generando...' : 'Generar Reporte PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
