'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { X, Loader2, Wrench } from 'lucide-react'

export interface ToolData {
  id?: string
  code: string
  name: string
  category: string
  type: 'FIXED_MACHINE' | 'FIXED_AREA' | 'PORTABLE'
  status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED'
  brand?: string | null
  serialNumber?: string | null
  assetId?: string | null
  area?: string | null
  assignedTo?: string | null
  notes?: string | null
}

interface AssetOption {
  id: string
  name: string
  code: string
  area: string
}

interface ToolFormModalProps {
  isOpen: boolean
  tool?: ToolData | null
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  'Eléctrica',
  'Mecánica',
  'Neumática',
  'Instrumentación',
  'Hidráulica',
  'Electrónica',
  'Medición y Calibración',
  'General',
]

const AREAS = [
  'Extrusión',
  'Impresión',
  'Sellado/Corte',
  'Rebobinado',
  'Reciclado',
  'Mezclado',
  'Planta de Fuerza',
  'Servicios Auxiliares',
  'Pañol Central',
]

export function ToolFormModal({ isOpen, tool, onClose, onSuccess }: ToolFormModalProps) {
  const isEditing = !!tool?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assets, setAssets] = useState<AssetOption[]>([])

  const [formData, setFormData] = useState<ToolData>({
    code: tool?.code || '',
    name: tool?.name || '',
    category: tool?.category || 'Mecánica',
    type: tool?.type || 'PORTABLE',
    status: tool?.status || 'AVAILABLE',
    brand: tool?.brand || '',
    serialNumber: tool?.serialNumber || '',
    assetId: tool?.assetId || '',
    area: tool?.area || '',
    notes: tool?.notes || '',
  })

  useEffect(() => {
    // Fetch assets for machine assignment
    const fetchAssets = async () => {
      try {
        const res = await fetch('/api/assets')
        if (res.ok) {
          const data = await res.json()
          setAssets(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Error loading assets:', err)
      }
    }
    fetchAssets()
  }, [])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/tools/${tool.id}` : '/api/tools'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la herramienta')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-primary">
            <Wrench className="w-5 h-5" />
            <h2 className="text-lg font-bold">
              {isEditing ? 'Editar Herramienta' : 'Registrar Nueva Herramienta'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Code TAG */}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Código / TAG <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g. HER-005"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="font-mono text-sm"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              Nombre de la Herramienta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Multímetro Fluke 87V"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-xs font-semibold">
              Tipo de Asignación / Uso <span className="text-destructive">*</span>
            </Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as any,
                  assetId: e.target.value !== 'FIXED_MACHINE' ? '' : formData.assetId,
                  area: e.target.value !== 'FIXED_AREA' ? '' : formData.area,
                })
              }
              required
            >
              <option value="PORTABLE">🔧 Portátil (Pañol / Préstamo a Técnico)</option>
              <option value="FIXED_MACHINE">⚙️ Fija en Máquina / Activo</option>
              <option value="FIXED_AREA">🏭 Fija en Área Operativa</option>
            </Select>
          </div>

          {/* Conditional Asset Selector if FIXED_MACHINE */}
          {formData.type === 'FIXED_MACHINE' && (
            <div className="space-y-1.5 animate-in fade-in">
              <Label htmlFor="assetId" className="text-xs font-semibold">
                Máquina / Activo Asignado
              </Label>
              <Select
                id="assetId"
                value={formData.assetId || ''}
                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
              >
                <option value="">-- Seleccionar Máquina --</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.code} - {asset.name} ({asset.area})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Conditional Area Input if FIXED_AREA */}
          {formData.type === 'FIXED_AREA' && (
            <div className="space-y-1.5 animate-in fade-in">
              <Label htmlFor="area" className="text-xs font-semibold">
                Área Operativa Asignada
              </Label>
              <Input
                id="area"
                placeholder="e.g. Sellado/Corte, Extrusión"
                value={formData.area || ''}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                list="area-suggestions"
              />
              <datalist id="area-suggestions">
                {AREAS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Brand */}
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs font-semibold">
                Marca / Fabricante
              </Label>
              <Input
                id="brand"
                placeholder="e.g. Fluke, Snap-on, Bosch"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            {/* Serial Number */}
            <div className="space-y-1.5">
              <Label htmlFor="serialNumber" className="text-xs font-semibold">
                Número de Serie
              </Label>
              <Input
                id="serialNumber"
                placeholder="e.g. SN-99812-B"
                value={formData.serialNumber || ''}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Notas / Observaciones
            </Label>
            <Textarea
              id="notes"
              placeholder="Detalles adicionales sobre el estado, calibración o ubicación..."
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : isEditing ? (
                'Guardar Cambios'
              ) : (
                'Registrar Herramienta'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
