'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
          <h3 className="text-lg font-bold">
            {isEditing ? 'Editar Proveedor / Contratista' : 'Registrar Nuevo Proveedor'}
          </h3>
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
                Nombre / Razón Social *
              </Label>
              <Input
                id="name"
                placeholder="Ej: TecnoSellos & Teflones"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId" className="font-semibold text-sm">
                RIF / Tax ID
              </Label>
              <Input
                id="taxId"
                placeholder="Ej: J-30495821-0"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-semibold text-sm">
                Categoría *
              </Label>
              <Select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="font-semibold text-sm">
                Estado *
              </Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName" className="font-semibold text-sm">
                Persona de Contacto
              </Label>
              <Input
                id="contactName"
                placeholder="Ej: Carlos Mendoza"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold text-sm">
                Teléfono
              </Label>
              <Input
                id="phone"
                placeholder="Ej: +58 414-555-0101"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-sm">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: ventas@proveedor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="font-semibold text-sm">
              Dirección Física / Ubicación
            </Label>
            <Input
              id="address"
              placeholder="Ej: Zona Industrial Paramillo, Galpón 12"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-sm">
              Calificación (1 a 5 estrellas)
            </Label>
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

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-semibold text-sm">
              Notas / Especialidad / Observaciones
            </Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Descripción de repuestos, marcas que distribuye o tipo de trabajos especiales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
                  <Save className="w-4 h-4 mr-2" /> Guardar Proveedor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
