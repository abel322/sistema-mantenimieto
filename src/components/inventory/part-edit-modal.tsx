'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Save, Loader2 } from 'lucide-react'

interface PartEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  part: {
    id: string
    name: string
    code: string
    category: string
    stock: number
    minStock: number
    unit: string
    price: number
    location?: string | null
    description?: string | null
  }
}

export function PartEditModal({
  isOpen,
  onClose,
  onSuccess,
  part,
}: PartEditModalProps) {
  const [name, setName] = useState(part.name)
  const [code, setCode] = useState(part.code)
  const [category, setCategory] = useState(part.category)
  const [stock, setStock] = useState(part.stock.toString())
  const [minStock, setMinStock] = useState(part.minStock.toString())
  const [unit, setUnit] = useState(part.unit)
  const [price, setPrice] = useState(part.price.toString())
  const [location, setLocation] = useState(part.location || '')
  const [description, setDescription] = useState(part.description || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName(part.name)
      setCode(part.code)
      setCategory(part.category)
      setStock(part.stock.toString())
      setMinStock(part.minStock.toString())
      setUnit(part.unit)
      setPrice(part.price.toString())
      setLocation(part.location || '')
      setDescription(part.description || '')
    }
  }, [isOpen, part])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !code.trim()) {
      setError('El nombre y el código del repuesto son obligatorios')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/inventory/${part.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          category,
          stock: parseInt(stock) || 0,
          minStock: parseInt(minStock) || 0,
          unit,
          price: parseFloat(price) || 0,
          location,
          description,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar el repuesto')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al actualizar el repuesto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
          <h3 className="text-lg font-bold">Editar Repuesto / Insumo</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold text-sm">
                Nombre del Repuesto *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="font-semibold text-sm">
                Código SKU *
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-semibold text-sm">
                Categoría
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="font-semibold text-sm">
                Unidad de Medida
              </Label>
              <Input
                id="unit"
                placeholder="Unidades, Litros, Metros"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock" className="font-semibold text-sm">
                Stock Actual *
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock" className="font-semibold text-sm">
                Stock Mínimo *
              </Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="font-semibold text-sm">
                Precio ($) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="font-semibold text-sm">
              Ubicación en Almacén
            </Label>
            <Input
              id="location"
              placeholder="Estante A-2, Pasillo 3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold text-sm">
              Descripción
            </Label>
            <Textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="border-t pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
