'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { X, Save, Loader2, Star } from 'lucide-react'

export interface SupplierData {
  id?: string
  name: string
  taxId?: string | null
  category: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  status: string
  rating?: number | null
  notes?: string | null
}

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  supplier?: SupplierData | null
}

const CATEGORY_OPTIONS = [
  'Repuestos Mecánicos',
  'Automatización/Electricidad',
  'Mecanizado/Tornería',
  'Servicios Generales',
  'Neumática e Hidráulica',
  'Consumibles Industriales',
]

export function SupplierModal({
  isOpen,
  onClose,
  onSuccess,
  supplier,
}: SupplierModalProps) {
  const isEditing = !!supplier?.id

  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [rating, setRating] = useState<number>(5)
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setName(supplier.name || '')
        setTaxId(supplier.taxId || '')
        setCategory(supplier.category || CATEGORY_OPTIONS[0])
        setContactName(supplier.contactName || '')
        setPhone(supplier.phone || '')
        setEmail(supplier.email || '')
        setAddress(supplier.address || '')
        setStatus(supplier.status || 'ACTIVE')
        setRating(supplier.rating || 5)
        setNotes(supplier.notes || '')
      } else {
        setName('')
        setTaxId('')
        setCategory(CATEGORY_OPTIONS[0])
        setContactName('')
        setPhone('')
        setEmail('')
        setAddress('')
        setStatus('ACTIVE')
        setRating(5)
        setNotes('')
      }
      setError(null)
    }
  }, [isOpen, supplier])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('El nombre comercial o razón social es obligatorio')
      return
    }

    if (!category.trim()) {
      setError('La categoría del proveedor es obligatoria')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      name,
      taxId,
      category,
      contactName,
      phone,
      email,
      address,
      status,
      rating,
      notes,
    }

    try {
      const url = isEditing ? `/api/suppliers/${supplier.id}` : '/api/suppliers'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar el proveedor')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al procesar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 my-auto">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Editar Proveedor / Contratista' : 'Registrar Nuevo Proveedor'}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} type="button" className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {error && (
            <div className="p-3 text-sm bg-destructive/15 text-destructive border border-destructive/30 rounded-md font-medium">
              {error}
            </div>
          )}

          {/* 1. Mandatory First Field: Provider / Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nombre de la Empresa / Proveedor *
            </label>
            <Input
              className="w-full h-10 text-sm"
              placeholder="Ej: Inversiones Mecánicas C.A."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* 2. RIF / Tax ID */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              RIF / Tax ID *
            </label>
            <Input
              className="w-full h-10 text-sm font-mono"
              placeholder="Ej: J-30495821-0"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>

          {/* Categoría y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoría *
              </label>
              <Select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 text-sm"
                required
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estado *
              </label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 text-sm"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </Select>
            </div>
          </div>

          {/* Contacto, Teléfono, Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Persona de Contacto
              </label>
              <Input
                className="w-full h-10 text-sm"
                placeholder="Ej: Carlos Mendoza"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Teléfono
              </label>
              <Input
                className="w-full h-10 text-sm"
                placeholder="Ej: +58 414-555-0101"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Correo Electrónico
              </label>
              <Input
                type="email"
                className="w-full h-10 text-sm"
                placeholder="Ej: ventas@proveedor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dirección Física / Ubicación
            </label>
            <Input
              className="w-full h-10 text-sm"
              placeholder="Ej: Zona Industrial Paramillo, Galpón 12"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Calificación */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Calificación (1 a 5 estrellas)
            </label>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-semibold text-muted-foreground">
                ({rating} de 5 estrellas)
              </span>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notas / Especialidad / Observaciones
            </label>
            <Textarea
              rows={3}
              className="text-sm"
              placeholder="Descripción de repuestos, marcas que distribuye o tipo de trabajos especiales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              className="w-full sm:w-auto"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Guardar Proveedor
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
