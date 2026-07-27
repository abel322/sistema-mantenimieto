'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ExecutionStatus } from '@prisma/client'

export async function deleteChecklistExecution(id: string) {
  try {
    // Unlink any associated WorkOrder records safely
    await prisma.workOrder.updateMany({
      where: { checklistExecutionId: id },
      data: { checklistExecutionId: null },
    })

    // Delete the execution record (cascade deletes responses)
    await prisma.checklistExecution.delete({
      where: { id },
    })

    revalidatePath('/dashboard/checklists')
    return { success: true, message: 'Inspección eliminada correctamente.' }
  } catch (error: any) {
    console.error('Error deleting checklist execution:', error)
    return { success: false, error: error.message || 'Error al eliminar la inspección' }
  }
}

export async function updateChecklistExecution(
  id: string,
  data: {
    status?: ExecutionStatus
    notes?: string | null
    responses?: {
      id?: string
      itemId?: string
      valueBoolean?: boolean | null
      valueNumeric?: number | null
      valueText?: string | null
      notes?: string | null
      isFlagged?: boolean
    }[]
  }
) {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Update main execution details
      const exec = await tx.checklistExecution.update({
        where: { id },
        data: {
          ...(data.status ? { status: data.status } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      })

      // Update response items if provided
      if (data.responses && Array.isArray(data.responses)) {
        for (const resp of data.responses) {
          if (resp.id) {
            await tx.checklistResponse.update({
              where: { id: resp.id },
              data: {
                ...(resp.valueBoolean !== undefined ? { valueBoolean: resp.valueBoolean } : {}),
                ...(resp.valueNumeric !== undefined ? { valueNumeric: resp.valueNumeric } : {}),
                ...(resp.valueText !== undefined ? { valueText: resp.valueText } : {}),
                ...(resp.notes !== undefined ? { notes: resp.notes } : {}),
                ...(resp.isFlagged !== undefined ? { isFlagged: resp.isFlagged } : {}),
              },
            })
          }
        }
      }

      return exec
    })

    revalidatePath('/dashboard/checklists')
    return { success: true, execution: updated, message: 'Registro de inspección actualizado.' }
  } catch (error: any) {
    console.error('Error updating checklist execution:', error)
    return { success: false, error: error.message || 'Error al actualizar la inspección' }
  }
}
