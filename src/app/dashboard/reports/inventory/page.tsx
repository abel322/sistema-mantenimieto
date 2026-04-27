'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { generateInventoryPDF } from '@/lib/pdf-generator'

export default function InventoryReportPage() {
  const [loading, setLoading] = useState(false)

  async function handleGeneratePDF() {
    setLoading(true)
    try {
      // Obtener datos del inventario
      const response = await fetch('/api/inventory')
      const parts = await response.json()

      // Generar PDF
      const doc = generateInventoryPDF(parts)
      
      // Descargar
      doc.save(`reporte-inventario-${new Date().toISOString().split('T')[0]}.pdf`)
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
            Reporte de Inventario
          </h2>
          <p className="text-muted-foreground">
            Estado completo del inventario de repuestos
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
            <li>Resumen: Total de repuestos, stock bajo, sin stock</li>
            <li>Valor total del inventario</li>
            <li>Tabla detallada con todos los repuestos</li>
            <li>Stock actual vs stock mínimo</li>
            <li>Precios y valores por repuesto</li>
            <li>Estado de cada repuesto (OK, Stock Bajo, Sin Stock)</li>
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
