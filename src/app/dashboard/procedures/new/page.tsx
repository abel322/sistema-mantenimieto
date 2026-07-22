'use client'

import { ProcedureForm } from '@/components/procedures/procedure-form'

export default function NewProcedurePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <ProcedureForm />
    </div>
  )
}
