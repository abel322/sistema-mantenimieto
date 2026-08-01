'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { X, Save, Loader2, Cpu, Check, Mic } from 'lucide-react'
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

interface NewItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewItemModal({ isOpen, onClose, onSuccess }: NewItemModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState('0')
  const [minStock, setMinStock] = useState('5')
  const [unit, setUnit] = useState('pieza')
  const [price, setPrice] = useState('0')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [preferredSupplierId, setPreferredSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [allAssets, setAllAssets] = useState<AssetOption[]>([])
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isListening, listeningField, startListening } = useSpeechToText()

  const isListeningName = isListening && listeningField === 'name'
  const isListeningDescription = isListening && listeningField === 'description'

  useEffect(() => {
    if (isOpen) {
      setName('')
      setCode('')
      setCategory('')
      setStock('0')
      setMinStock('5')
      setUnit('pieza')
      setPrice('0')
      setLocation('')
      setDescription('')
      setPreferredSupplierId('')
      setSelectedAssetIds([])
      setError(null)

      fetch('/api/suppliers?status=ACTIVE')
        .then((res) => res.json())
        .then((data) => setSuppliers(Array.isArray(data) ? data : []))
        .catch(console.error)

      fetch('/api/assets')
        .then((res) => res.json())
        .then((data) => setAllAssets(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [isOpen])

  if (!isOpen) return null

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !code.trim()) {
      setError('El nombre y el código del repuesto son obligatorios')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          category: category.trim(),
          stock: parseInt(stock) || 0,
          minStock: parseInt(minStock) || 0,
          unit: unit.trim(),
          price: parseFloat(price) || 0,
          location: location.trim() || null,
          description: description.trim() || null,
          preferredSupplierId: preferredSupplierId || null,
          assetIds: selectedAssetIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear el repuesto')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al crear el repuesto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Nuevo Repuesto / Insumo
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} type="button" className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-1 space-y-4 pt-3">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                className="w-full h-10 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Resistencia tipo banda 220V"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Código SKU *
              </Label>
              <Input
                id="code"
                className="w-full h-10 text-sm font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: RES-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="category" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoría
              </Label>
              <Input
                id="category"
                className="w-full h-10 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Eléctrico, Mecánico"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="unit" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unidad de Medida
              </Label>
              <Input
                id="unit"
                className="w-full h-10 text-sm"
                placeholder="pieza, rollo, metro"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="stock" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Stock Inicial *
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                className="w-full h-10 text-sm"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="minStock" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Stock Mínimo *
              </Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                className="w-full h-10 text-sm"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="price" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Precio ($) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className="w-full h-10 text-sm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="location" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ubicación en Almacén
              </Label>
              <Input
                id="location"
                className="w-full h-10 text-sm"
                placeholder="Estante A-2, Pasillo 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="preferredSupplierId" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Proveedor Sugerido / Principal
              </Label>
              <Select
                id="preferredSupplierId"
                className="w-full h-10 text-sm"
                value={preferredSupplierId}
                onChange={(e) => setPreferredSupplierId(e.target.value)}
              >
                <option value="">-- Sin Proveedor --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.category})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Activos / Máquinas Compatibles */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-primary" />
                Activos / Máquinas Compatibles
              </Label>
              {selectedAssetIds.length > 0 && (
                <Badge variant="secondary" className="text-[11px]">
                  {selectedAssetIds.length} seleccionada(s)
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-slate-50 dark:bg-slate-800/40">
              {allAssets.map((asset) => {
                const isSelected = selectedAssetIds.includes(asset.id)
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleAsset(asset.id)}
                    className={`flex items-center justify-between p-2 rounded text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-background text-muted-foreground hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate text-foreground font-semibold text-[11px]">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{asset.code}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                  </button>
                )
              })}
              {allAssets.length === 0 && (
                <p className="col-span-full text-xs text-muted-foreground text-center py-2">
                  No hay máquinas registradas en el sistema.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
              rows={2}
              className="text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Resistencia blindada para extrusora n°3..."
            />
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Crear Repuesto
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
