'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Asset } from '@prisma/client'

interface ScheduleFormProps {
  assets: Asset[]
}

export function ScheduleForm({ assets }: ScheduleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      assetId: formData.get('assetId'),
      frequencyDays: parseInt(formData.get('frequencyDays') as string),
      frequencyType: formData.get('frequencyType'),
      nextDueDate: formData.get('nextDueDate'),
      taskTemplate: formData.get('taskTemplate'),
    }

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push('/dashboard/schedule')
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Programación</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assetId">Activo *</Label>
              <Select id="assetId" name="assetId" required>
                <option value="">Seleccionar activo</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequencyType">Tipo de Frecuencia *</Label>
              <Select id="frequencyType" name="frequencyType" required>
                <option value="">Seleccionar tipo</option>
                <option value="CALENDAR">Por Calendario</option>
                <option value="USAGE_HOURS">Por Horas de Uso</option>
                <option value="USAGE_METERS">Por Metros Producidos</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequencyDays">Frecuencia (días) *</Label>
              <Input
                id="frequencyDays"
                name="frequencyDays"
                type="number"
                min="1"
                placeholder="30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextDueDate">Próxima Fecha *</Label>
              <Input
                id="nextDueDate"
                name="nextDueDate"
                type="date"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskTemplate">Descripción de la Tarea *</Label>
            <Textarea
              id="taskTemplate"
              name="taskTemplate"
              placeholder="Describe las tareas a realizar..."
              rows={4}
              required
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
              {loading ? 'Creando...' : 'Crear Programación'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
