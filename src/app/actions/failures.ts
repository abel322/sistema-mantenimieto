'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface FailureLogPayload {
  id?: string
  assetId?: string
  symptom: string
  rootCause?: string | null
  downtimeHours?: number
  reportedAt?: string | Date
  resolvedAt?: string | Date | null
}

export async function updateFailureReport(id: string, data: Partial<FailureLogPayload>) {
  try {
    const { symptom, rootCause, downtimeHours, reportedAt, resolvedAt, assetId } = data

    const updateData: any = {}

    if (symptom !== undefined) updateData.symptom = symptom
    if (rootCause !== undefined) updateData.rootCause = rootCause || null
    if (downtimeHours !== undefined) updateData.downtimeHours = Number(downtimeHours) || 0
    if (reportedAt !== undefined) updateData.reportedAt = new Date(reportedAt!)
    if (resolvedAt !== undefined) updateData.resolvedAt = resolvedAt ? new Date(resolvedAt) : null
    if (assetId !== undefined) updateData.assetId = assetId

    const failureLog = await prisma.failureLog.update({
      where: { id },
      data: updateData,
      include: {
        asset: true,
      },
    })

    revalidatePath('/dashboard/assets')
    revalidatePath(`/dashboard/assets/${failureLog.assetId}`)
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/reports/maintenance')

    return { success: true, failureLog }
  } catch (error: any) {
    console.error('Error updating failure report:', error)
    return { success: false, error: error.message || 'Error al actualizar el registro de falla' }
  }
}

export async function deleteFailureReport(id: string) {
  try {
    const existingLog = await prisma.failureLog.findUnique({
      where: { id },
      select: { id: true, assetId: true },
    })

    if (!existingLog) {
      return { success: false, error: 'El registro de falla no existe' }
    }

    await prisma.failureLog.delete({
      where: { id },
    })

    revalidatePath('/dashboard/assets')
    revalidatePath(`/dashboard/assets/${existingLog.assetId}`)
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/reports/maintenance')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting failure report:', error)
    return { success: false, error: error.message || 'Error al eliminar el registro de falla' }
  }
}
