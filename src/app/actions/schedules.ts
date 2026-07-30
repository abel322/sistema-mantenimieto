'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface SchedulePayload {
  assetId: string
  frequencyDays?: number
  frequencyType?: 'CALENDAR' | 'USAGE_HOURS' | 'USAGE_METERS'
  nextDueDate: string | Date
  taskTemplate: string
  isActive?: boolean
}

export async function getMaintenanceSchedulesAction() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { nextDueDate: 'asc' },
      include: {
        asset: true,
      },
    })
    return { success: true, schedules: JSON.parse(JSON.stringify(schedules)) }
  } catch (error: any) {
    console.error('Error fetching maintenance schedules:', error)
    return { success: false, schedules: [], error: error.message }
  }
}

export async function createScheduleAction(payload: SchedulePayload) {
  try {
    const { assetId, frequencyDays, frequencyType = 'CALENDAR', nextDueDate, taskTemplate, isActive = true } = payload

    const schedule = await prisma.schedule.create({
      data: {
        assetId,
        frequencyDays: Number(frequencyDays) || 30,
        frequencyType,
        nextDueDate: new Date(nextDueDate),
        taskTemplate,
        isActive,
      },
      include: {
        asset: true,
      },
    })

    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard/schedules')
    revalidatePath('/dashboard/programacion')
    revalidatePath(`/dashboard/assets/${assetId}`)

    return { success: true, schedule }
  } catch (error: any) {
    console.error('Error creating schedule action:', error)
    return { success: false, error: error.message || 'Error al crear la programación' }
  }
}

export async function updateScheduleAction(id: string, payload: Partial<SchedulePayload>) {
  try {
    const { assetId, frequencyDays, frequencyType, nextDueDate, taskTemplate, isActive } = payload

    const updateData: any = {}
    if (assetId !== undefined) updateData.assetId = assetId
    if (frequencyDays !== undefined) updateData.frequencyDays = Number(frequencyDays) || 30
    if (frequencyType !== undefined) updateData.frequencyType = frequencyType
    if (nextDueDate !== undefined) updateData.nextDueDate = new Date(nextDueDate)
    if (taskTemplate !== undefined) updateData.taskTemplate = taskTemplate
    if (isActive !== undefined) updateData.isActive = isActive

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        asset: true,
      },
    })

    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard/schedules')
    revalidatePath('/dashboard/programacion')
    revalidatePath(`/dashboard/assets/${schedule.assetId}`)

    return { success: true, schedule }
  } catch (error: any) {
    console.error('Error updating schedule action:', error)
    return { success: false, error: error.message || 'Error al actualizar la programación' }
  }
}

export async function deleteScheduleAction(id: string) {
  try {
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      select: { id: true, assetId: true },
    })

    if (!existingSchedule) {
      return { success: false, error: 'La programación no existe' }
    }

    await prisma.schedule.delete({
      where: { id },
    })

    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard/schedules')
    revalidatePath('/dashboard/programacion')
    revalidatePath(`/dashboard/assets/${existingSchedule.assetId}`)

    return { success: true, id }
  } catch (error: any) {
    console.error('Error deleting schedule action:', error)
    return { success: false, error: error.message || 'Error al eliminar la programación' }
  }
}
