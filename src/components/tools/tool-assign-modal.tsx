'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { X, Loader2, UserCheck, Wrench } from 'lucide-react'

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

interface ToolAssignModalProps {
  isOpen: boolean
  tool: {
    id: string
    code: string
    name: string
    category: string
    brand?: string | null
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function ToolAssignModal({ isOpen, tool, onClose, onSuccess }: ToolAssignModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [technicians, setTechnicians] = useState<UserOption[]>([])
  
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [customTechnician, setCustomTechnician] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      const fetchTechnicians = async () => {
        try {
          const res = await fetch('/api/technicians')
          if (res.ok) {
            const data = await res.json()
            setTechnicians(Array.isArray(data) ? data : [])
          }
        } catch (err) {
          console.error('Error fetching technicians:', err)
        }
      }
      fetchTechnicians()
    }
  }, [isOpen])

  if (!isOpen || !tool) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const assignedToName = selectedTechnician === 'OTHER' 
      ? customTechnician 
      : selectedTechnician

    if (!assignedToName.trim()) {
      setError('Por favor especifica a quién se asigna la herramienta')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          assignedTo: assignedToName.trim(),
          notes: notes.trim() ? notes.trim() : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al asignar la herramienta')
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
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-amber-500/10 dark:bg-amber-500/20">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <UserCheck className="w-5 h-5" />
            <h2 className="text-lg font-bold">Asignar / Prestar Herramienta</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              <span>{tool.name}</span>
            </div>
            <p className="text-muted-foreground font-mono">
              Código: {tool.code} {tool.brand && `• Marca: ${tool.brand}`}
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive border border-destructive/30 rounded-lg">
              {error}
            </div>
          )}

          {/* Select Technician */}
          <div className="space-y-1.5">
            <Label htmlFor="technicianSelect" className="text-xs font-semibold">
              Técnico / Responsable <span className="text-destructive">*</span>
            </Label>
            <Select
              id="technicianSelect"
              value={selectedTechnician}
              onChange={(e) => {
                setSelectedTechnician(e.target.value)
                if (e.target.value !== 'OTHER') {
                  setCustomTechnician('')
                }
              }}
              required
            >
              <option value="">-- Seleccionar Técnico --</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={`${tech.name} (${tech.role === 'ADMIN' ? 'Administrador' : 'Técnico'})`}>
                  {tech.name} ({tech.email})
                </option>
              ))}
              <option value="OTHER">✍️ Otro (Ingresar Nombre Manualmente)</option>
            </Select>
          </div>

          {/* Custom Name if OTHER */}
          {selectedTechnician === 'OTHER' && (
            <div className="space-y-1.5 animate-in fade-in">
              <Label htmlFor="customTechnician" className="text-xs font-semibold">
                Nombre Completo del Responsable <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customTechnician"
                placeholder="e.g. Carlos Ruiz (Contratista Electromecánico)"
                value={customTechnician}
                onChange={(e) => setCustomTechnician(e.target.value)}
                required
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="assignNotes" className="text-xs font-semibold">
              Motivo u Observación de Salida
            </Label>
            <Textarea
              id="assignNotes"
              placeholder="e.g. Prestada para mantenimiento preventivo en Extrusora 2"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...
                </>
              ) : (
                'Confirmar Préstamo'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
