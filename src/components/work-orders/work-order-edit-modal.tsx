'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { X, Save, Loader2 } from 'lucide-react'

interface AssetOption {
  id: string
  name: string
  code: string
}

interface TechnicianOption {
  id: string
  name: string
  role: string
}

interface WorkOrderEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  workOrder: {
    id: string
    title: string
    description?: string | null
    assetId: string
    priority: string
    type: string
    technicianId: string
    status: string
    laborHours?: number | null
  }
}

export function WorkOrderEditModal({
  isOpen,
  onClose,
  onSuccess,
  workOrder,
}: WorkOrderEditModalProps) {
  const [title, setTitle] = useState(workOrder.title)
  const [description, setDescription] = useState(workOrder.description || '')
  const [assetId, setAssetId] = useState(workOrder.assetId)
  const [priority, setPriority] = useState(workOrder.priority)
  const [type, setType] = useState(workOrder.type)
  const [technicianId, setTechnicianId] = useState(workOrder.technicianId)
  const [status, setStatus] = useState(workOrder.status)
  const [laborHours, setLaborHours] = useState(workOrder.laborHours?.toString() || '0')

  const [assets, setAssets] = useState<AssetOption[]>([])
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(workOrder.title)
      setDescription(workOrder.description || '')
      setAssetId(workOrder.assetId)
      setPriority(workOrder.priority)
      setType(workOrder.type)
      setTechnicianId(workOrder.technicianId)
      setStatus(workOrder.status)
      setLaborHours(workOrder.laborHours?.toString() || '0')

      // Fetch assets & technicians
      fetch('/api/assets')
        .then((res) => res.json())
        .then((data) => setAssets(Array.isArray(data) ? data : []))
        .catch(console.error)

      fetch('/api/work-orders')
        .then((res) => res.json())
        .then((data) => {
          // Extract technicians from work orders or default list
          if (Array.isArray(data)) {
            const techsMap: Record<string, TechnicianOption> = {}
            data.forEach((wo) => {
              if (wo.technician) {
                techsMap[wo.technician.id] = wo.technician
              }
            })
            setTechnicians(Object.values(techsMap))
          }
        })
        .catch(console.error)
    }
  }, [isOpen, workOrder])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('El título de la orden es obligatorio')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          assetId,
          priority,
          type,
          technicianId,
          status,
          laborHours: parseFloat(laborHours) || 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar la orden')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al actualizar la orden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
          <h3 className="text-lg font-bold">Editar Orden de Trabajo</h3>
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

          <div className="space-y-2">
            <Label htmlFor="title" className="font-semibold text-sm">
              Título de la Orden *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold text-sm">
              Descripción / Instrucciones
            </Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset" className="font-semibold text-sm">
                Activo / Maquinaria *
              </Label>
              <Select
                id="asset"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                required
              >
                {assets.map((ast) => (
                  <option key={ast.id} value={ast.id}>
                    {ast.name} ({ast.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician" className="font-semibold text-sm">
                Técnico Asignado *
              </Label>
              <Select
                id="technician"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                required
              >
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.role})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="font-semibold text-sm">
                Prioridad
              </Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="font-semibold text-sm">
                Tipo
              </Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="PREVENTIVE">Preventivo</option>
                <option value="CORRECTIVE">Correctivo</option>
                <option value="PREDICTIVE">Predictivo</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="font-semibold text-sm">
                Estado
              </Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="OPEN">Abierta</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="ON_HOLD">En Pausa</option>
                <option value="CLOSED">Cerrada</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="laborHours" className="font-semibold text-sm">
              Horas Hombre de Mano de Obra
            </Label>
            <Input
              id="laborHours"
              type="number"
              step="0.5"
              min="0"
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
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
