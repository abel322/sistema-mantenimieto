'use client'

import { useState, useEffect } from 'react'
import { ChecklistTemplate } from '@/types/checklists'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateModal } from '@/components/checklists/template-modal'
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Edit3, 
  Trash2, 
  ListChecks, 
  RefreshCw, 
  SlidersHorizontal 
} from 'lucide-react'
import { getAreaLabel } from '@/lib/constants'

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checklists/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (tpl: ChecklistTemplate) => {
    setEditingTemplate(tpl)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta plantilla de inspección? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/checklists/templates/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchTemplates()
      } else {
        alert('Error al eliminar la plantilla.')
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      alert('Error de conexión al eliminar.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/checklists">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Volver
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" /> Gestión de Plantillas de Inspección
          </h2>
          <p className="text-muted-foreground text-sm">
            Cree y configure protocolos de checklist para maquinarias de planta.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Templates Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Cargando plantillas de inspección...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <ListChecks className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">No hay plantillas registradas</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Cree su primera plantilla de checklist para empezar a realizar inspecciones en los activos de planta.
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Crear Primera Plantilla
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col justify-between border-2 hover:border-primary/50 transition-all shadow-sm">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">
                    {getAreaLabel(tpl.assetType)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {tpl.items?.length || 0} parámetros
                  </span>
                </div>

                <CardTitle className="text-lg leading-tight">{tpl.title}</CardTitle>
                {tpl.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {tpl.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* List of items summary */}
                <div className="border rounded-md p-3 bg-muted/20 space-y-2 text-xs max-h-[140px] overflow-y-auto">
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Parámetros incluidos:
                  </span>
                  {tpl.items?.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-muted-foreground">
                      <span className="truncate pr-2">• {item.label}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 flex-shrink-0">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                  {tpl.items && tpl.items.length > 5 && (
                    <span className="text-[10px] text-primary italic block text-right pt-1">
                      + {tpl.items.length - 5} parámetros más...
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(tpl)}
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(tpl.id)}
                    disabled={deletingId === tpl.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Edit / Create Modal */}
      <TemplateModal
        template={editingTemplate}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchTemplates}
      />
    </div>
  )
}
