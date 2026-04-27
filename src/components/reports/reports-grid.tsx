'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Package, Wrench, BarChart3, Download } from 'lucide-react'
import Link from 'next/link'

const reports = [
  {
    title: 'Reporte General de Mantenimiento',
    description: 'KPIs, distribución de mantenimiento y top fallas',
    icon: BarChart3,
    href: '/dashboard/reports/maintenance',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Reporte de Inventario',
    description: 'Estado completo del inventario de repuestos',
    icon: Package,
    href: '/dashboard/reports/inventory',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Reportes de Órdenes de Trabajo',
    description: 'Genera reportes individuales de órdenes',
    icon: Wrench,
    href: '/dashboard/reports/work-orders',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Reportes de Activos',
    description: 'Historial completo de activos y mantenimiento',
    icon: FileText,
    href: '/dashboard/reports/assets',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
]

export function ReportsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      {reports.map((report) => {
        const Icon = report.icon
        return (
          <Link key={report.title} href={report.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Generar Reporte
                </Button>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
