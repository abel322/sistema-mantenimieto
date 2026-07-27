'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Loader2 } from 'lucide-react'

import { updateAsset } from '@/app/actions/assets'
import { PLANT_AREAS } from '@/lib/constants'

export interface AssetData {
  id?: string
  name: string
  code: string
  area: string
  criticality: number
  description?: string | null
}

interface AssetFormProps {
  initialData?: AssetData
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssetForm({ initialData, onSuccess, onCancel }: AssetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(initialData?.id)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      area: formData.get('area') as string,
      criticality: parseInt(formData.get('criticality') as string),
      description: formData.get('description') as string,
    }

    try {
      if (isEditing && initialData?.id) {
        const actionRes = await updateAsset(initialData.id, data)
        if (!actionRes.success) {
          // Fallback to API route
          const response = await fetch(`/api/assets/${initialData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const resData = await response.json()
          if (!response.ok) {
            throw new Error(resData.error || actionRes.error || 'Ocurrió un error al actualizar el activo')
          }
        }
      } else {
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const resData = await response.json()

        if (!response.ok) {
          throw new Error(resData.error || 'Ocurrió un error al crear el activo')
        }
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/assets')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Error saving asset:', err)
      setError(err.message || 'Error al guardar el activo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? `Editar Activo: ${initialData?.name}` : 'Información del Activo'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-950/50 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initialData?.name || ''}
                placeholder="Ej: Extrusora 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código / TAG *</Label>
              <Input
                id="code"
                name="code"
                defaultValue={initialData?.code || ''}
                placeholder="Ej: EXT-01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área / Tipo de Maquinaria *</Label>
              <Select id="area" name="area" defaultValue={initialData?.area || ''} required>
                <option value="">Seleccionar área</option>
                {PLANT_AREAS.map((pa) => (
                  <option key={pa.value} value={pa.value}>
                    {pa.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticality">Criticidad *</Label>
              <Select
                id="criticality"
                name="criticality"
                defaultValue={initialData?.criticality ? String(initialData.criticality) : ''}
                required
              >
                <option value="">Seleccionar criticidad</option>
                <option value="1">Criticidad 1 (Alta)</option>
                <option value="2">Criticidad 2 (Media)</option>
                <option value="3">Criticidad 3 (Baja)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description || ''}
              placeholder="Describe el activo..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (onCancel ? onCancel() : router.back())}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </>
              ) : isEditing ? (
                'Guardar Cambios'
              ) : (
                'Crear Activo'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
