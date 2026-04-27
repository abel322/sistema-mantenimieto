'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function AssetForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      area: formData.get('area'),
      criticality: parseInt(formData.get('criticality') as string),
      description: formData.get('description'),
    }

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push('/dashboard/assets')
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating asset:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Activo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej: Extrusora 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                name="code"
                placeholder="Ej: EXT-01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Select id="area" name="area" required>
                <option value="">Seleccionar área</option>
                <option value="EXTRUSION">Extrusión</option>
                <option value="PRINTING">Impresión</option>
                <option value="SEALING">Sellado/Corte</option>
                <option value="AUXILIARY">Servicios Auxiliares</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticality">Criticidad *</Label>
              <Select id="criticality" name="criticality" required>
                <option value="">Seleccionar criticidad</option>
                <option value="1">1 - Baja</option>
                <option value="2">2 - Media</option>
                <option value="3">3 - Alta</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe el activo..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Activo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
