'use client'

import { useState, useEffect } from 'react'
import { ProcedureForm } from '@/components/procedures/procedure-form'
import { TaskPlan } from '@/types/procedures'
import { Loader2 } from 'lucide-react'

export default function EditProcedurePage({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState<TaskPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`/api/procedures/${params.id}`)
        if (!res.ok) {
          throw new Error('Pauta técnica no encontrada')
        }
        const data = await res.json()
        setPlan(data)
      } catch (err: any) {
        console.error('Error loading procedure:', err)
        setError(err.message || 'Error al cargar la pauta técnica')
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground font-medium">Cargando pauta técnica...</p>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="p-8 text-center text-destructive border rounded-lg max-w-xl mx-auto my-12">
        <h3 className="text-lg font-bold">Error</h3>
        <p className="text-sm">{error || 'No se encontró la pauta técnica'}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <ProcedureForm initialData={plan} isEdit={true} />
    </div>
  )
}
