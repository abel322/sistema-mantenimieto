'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Cpu, Check, Mic } from 'lucide-react'
import { useSpeechToText } from '@/hooks/use-speech-to-text'

interface SupplierOption {
  id: string
  name: string
  category: string
}

interface AssetOption {
  id: string
  name: string
  code: string
}

export function PartForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { isListening, listeningField, startListening } = useSpeechToText()

  const isListeningName = isListening && listeningField === 'name'
  const isListeningDescription = isListening && listeningField === 'description'

  useEffect(() => {
    fetch('/api/suppliers?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(console.error)

    fetch('/api/assets')
      .then((res) => res.json())
      .then((data) => setAssets(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: (formData.get('description') as string) || null,
      stock: parseInt(formData.get('stock') as string) || 0,
      minStock: parseInt(formData.get('minStock') as string) || 0,
      price: parseFloat(formData.get('price') as string) || 0,
      unit: formData.get('unit') as string,
      category: formData.get('category') as string,
      preferredSupplierId: (formData.get('preferredSupplierId') as string) || null,
      assetIds: selectedAssetIds,
    }

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push('/dashboard/inventory')
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating part:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-xl font-bold">Información del Repuesto</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="font-semibold text-sm">
                  Nombre del Repuesto *
                </Label>
                <Button
                  onClick={() =>
                    startListening('name', (transcript) => {
                      setName((prev) => (prev ? `${prev} ${transcript}` : transcript))
                    })
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                  className={isListeningName ? 'text-red-500 animate-pulse' : 'text-slate-500'}
                  title="Dictar por voz"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Resistencia tipo banda 220V"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="font-semibold text-sm">
                Código SKU / Tag *
              </Label>
              <Input
                id="code"
                name="code"
                placeholder="Ej: RES-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock" className="font-semibold text-sm">
                Stock Inicial *
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock" className="font-semibold text-sm">
                Stock Mínimo *
              </Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                min="0"
                placeholder="5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="font-semibold text-sm">
                Precio Unitario ($) *
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="font-semibold text-sm">
                Unidad de Medida *
              </Label>
              <Input
                id="unit"
                name="unit"
                placeholder="Ej: pieza, rollo, metro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="font-semibold text-sm">
                Categoría
              </Label>
              <Input
                id="category"
                name="category"
                placeholder="Ej: Eléctrico, Mecánico, Consumible"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredSupplierId" className="font-semibold text-sm">
                Proveedor Sugerido / Principal
              </Label>
              <Select id="preferredSupplierId" name="preferredSupplierId">
                <option value="">-- Ninguno / Sin Proveedor --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.category})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="font-semibold text-sm">
                  Descripción
                </Label>
                <Button
                  onClick={() =>
                    startListening('description', (transcript) => {
                      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript))
                    })
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                  className={isListeningDescription ? 'text-red-500 animate-pulse' : 'text-slate-500'}
                  title="Dictar por voz"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Resistencia blindada para extrusora n°3, 1000W, diámetro 120mm..."
              />
            </div>
          </div>

          {/* Activos / Máquinas Compatibles */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-bold text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Activos / Máquinas Compatibles
                </Label>
                <p className="text-xs text-muted-foreground">
                  Selecciona una o más máquinas donde este repuesto es instalable o crítico.
                </p>
              </div>
              {selectedAssetIds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedAssetIds.length} seleccionada(s)
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-muted/20">
              {assets.map((asset) => {
                const isSelected = selectedAssetIds.includes(asset.id)
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleAsset(asset.id)}
                    className={`flex items-center justify-between p-2.5 rounded-md text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-background text-muted-foreground hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate text-foreground font-semibold">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{asset.code}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-primary" />}
                  </button>
                )
              })}
              {assets.length === 0 && (
                <p className="col-span-full text-xs text-muted-foreground text-center py-4">
                  Cargando o no hay máquinas registradas en la planta.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Repuesto'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
