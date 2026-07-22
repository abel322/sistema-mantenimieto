'use client'

import { useState, useEffect } from 'react'
import { ChecklistTemplate, ChecklistItem, ChecklistItemType } from '@/types/checklists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react'

interface TemplateModalProps {
  template: ChecklistTemplate | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

interface EditableItem {
  id?: string
  label: string
  type: ChecklistItemType
  isRequired: boolean
  minValue?: string | number
  maxValue?: string | number
}

export function TemplateModal({ template, isOpen, onClose, onSaved }: TemplateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assetType, setAssetType] = useState('SEALING')
  const [items, setItems] = useState<EditableItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setDescription(template.description || '')
      setAssetType(template.assetType || 'SEALING')
      setItems(
        template.items?.map((item) => ({
          id: item.id,
          label: item.label,
          type: item.type,
          isRequired: item.isRequired,
          minValue: item.minValue ?? '',
          maxValue: item.maxValue ?? '',
        })) || []
      )
    } else {
      setTitle('')
      setDescription('')
      setAssetType('SEALING')
      setItems([
        { label: 'Estado de componentes principales', type: 'BOOLEAN', isRequired: true },
        { label: 'Presión / Temperatura de trabajo', type: 'NUMERIC', isRequired: true, minValue: 0, maxValue: 100 },
      ])
    }
    setError(null)
  }, [template, isOpen])

  if (!isOpen) return null

  const addItem = () => {
    setItems([
      ...items,
      { label: '', type: 'BOOLEAN', isRequired: true, minValue: '', maxValue: '' },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setError('La plantilla debe tener al menos un parámetro.')
      return
    }
    const updated = [...items]
    updated.splice(index, 1)
    setItems(updated)
  }

  const updateItem = (index: number, field: keyof EditableItem, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('El título de la plantilla es obligatorio.')
      return
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].label.trim()) {
        setError(`El parámetro #${i + 1} requiere una descripción / nombre.`)
        return
      }
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        title,
        description,
        assetType,
        items,
      }

      const url = template
        ? `/api/checklists/templates/${template.id}`
        : '/api/checklists/templates'
      const method = template ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar la plantilla')
      }

      onSaved()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div>
            <h3 className="text-lg font-bold">
              {template ? 'Editar Plantilla de Inspección' : 'Nueva Plantilla de Inspección'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure los parámetros y reglas de inspección para la maquinaria.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md font-medium">
              {error}
            </div>
          )}

          {/* Basic Template Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="font-semibold">
                Título de la Plantilla *
              </Label>
              <Input
                id="title"
                placeholder="Ej. Inspección Diaria - Extrusora Monocapa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetType" className="font-semibold">
                Tipo / Área de Maquinaria
              </Label>
              <Select
                id="assetType"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
              >
                <option value="SEALING">Bolseras / Selladoras (SEALING)</option>
                <option value="EXTRUSION">Extrusoras (EXTRUSION)</option>
                <option value="PRINTING">Impresoras (PRINTING)</option>
                <option value="AUXILIARY">Auxiliares (AUXILIARY)</option>
                <option value="GENERAL">General / Toda la planta</option>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="font-semibold">
                Descripción / Instrucciones Generales
              </Label>
              <Textarea
                id="description"
                placeholder="Instrucciones para el técnico de piso..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Items Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-sm font-bold tracking-tight">Ítems / Parámetros a Inspeccionar</h4>
                <p className="text-xs text-muted-foreground">
                  Defina si el parámetro es de verificación V/F (BOOLEAN) o lectura numérica con rango.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Agregar Parámetro
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-card space-y-3 relative group transition-colors hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* Item Label */}
                    <div className="sm:col-span-6 space-y-1">
                      <Label className="text-xs font-semibold">Descripción del Parámetro</Label>
                      <Input
                        placeholder="Ej. Temperatura de mordaza"
                        value={item.label}
                        onChange={(e) => updateItem(index, 'label', e.target.value)}
                        required
                      />
                    </div>

                    {/* Item Type */}
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-xs font-semibold">Tipo de Campo</Label>
                      <Select
                        value={item.type}
                        onChange={(e) => updateItem(index, 'type', e.target.value as ChecklistItemType)}
                      >
                        <option value="BOOLEAN">Verificación Estado (OK / NO OK)</option>
                        <option value="NUMERIC">Lectura Numérica (Medición)</option>
                        <option value="TEXT">Texto / Comentario libre</option>
                      </Select>
                    </div>

                    {/* Is Required Check */}
                    <div className="sm:col-span-2 flex items-center h-10 pt-4">
                      <label className="flex items-center space-x-2 text-xs cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={item.isRequired}
                          onChange={(e) => updateItem(index, 'isRequired', e.target.checked)}
                        />
                        <span>Requerido</span>
                      </label>
                    </div>
                  </div>

                  {/* Numeric limits configuration */}
                  {item.type === 'NUMERIC' && (
                    <div className="pt-2 border-t border-dashed grid grid-cols-2 gap-3 bg-muted/20 p-2.5 rounded-md">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Límite Mínimo Permitido (Opcional)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Ej. 140"
                          value={item.minValue ?? ''}
                          onChange={(e) => updateItem(index, 'minValue', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Límite Máximo Permitido (Opcional)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Ej. 200"
                          value={item.maxValue ?? ''}
                          onChange={(e) => updateItem(index, 'maxValue', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
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
                  <Save className="w-4 h-4 mr-2" /> Guardar Plantilla
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
