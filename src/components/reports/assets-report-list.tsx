'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { generateAssetPDF } from '@/lib/pdf-generator'

import { getAreaLabel } from '@/lib/constants'

const criticalityColors = {
  1: 'secondary',
  2: 'warning',
  3: 'destructive',
} as const

export function AssetsReportList() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/assets', { cache: 'no-store' })
      .then((res) => res.json())
      .then(setAssets)
  }, [])

  async function handleGeneratePDF(assetId: string) {
    setLoading(assetId)
    try {
      const response = await fetch(`/api/reports/assets/${assetId}`)
      const asset = await response.json()

      const doc = generateAssetPDF(asset)
      doc.save(`activo-${asset.code}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el reporte')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => (
        <Card key={asset.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{asset.name}</h3>
                  <p className="text-sm text-muted-foreground">{asset.code}</p>
                </div>
                <Badge variant={criticalityColors[asset.criticality as 1 | 2 | 3]}>
                  Crit. {asset.criticality}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {getAreaLabel(asset.area)}
              </p>

              <Button
                onClick={() => handleGeneratePDF(asset.id)}
                disabled={loading === asset.id}
                className="w-full gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                {loading === asset.id ? 'Generando...' : 'Generar PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {assets.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No hay activos registrados</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
