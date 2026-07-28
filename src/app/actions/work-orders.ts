'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { OrderType, Priority } from '@prisma/client'

export interface CreateWorkOrderInput {
  title: string
  description: string
  type: OrderType | string
  priority: Priority | string
  assetId: string
  technicianId: string
  guidelineId?: string | null
  externalVendorId?: string | null
  materials?: {
    inventoryItemId?: string | null
    customName?: string | null
    isCustom?: boolean
    quantityUsed: number
  }[]
  tools?: (
    | string
    | {
        toolId?: string | null
        customName?: string | null
        isCustom?: boolean
      }
  )[]
}

export async function createWorkOrder(data: CreateWorkOrderInput) {
  try {
    const {
      title,
      description,
      type,
      priority,
      assetId,
      technicianId,
      guidelineId,
      externalVendorId,
      materials = [],
      tools = [],
    } = data

    if (!title || !description || !type || !priority || !assetId || !technicianId) {
      return { success: false, error: 'Por favor complete todos los campos obligatorios.' }
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        title,
        description,
        type: type as OrderType,
        priority: priority as Priority,
        assetId,
        technicianId,
        guidelineId: guidelineId || null,
        externalVendorId: externalVendorId || null,
        materials: materials.length > 0
          ? {
              create: materials.map((m) => ({
                inventoryItemId: m.isCustom ? null : (m.inventoryItemId || null),
                customName: m.isCustom ? m.customName : null,
                isCustom: !!m.isCustom,
                quantityUsed: typeof m.quantityUsed === 'number' ? m.quantityUsed : parseFloat(m.quantityUsed as any) || 1,
              })),
            }
          : undefined,
        tools: tools.length > 0
          ? {
              create: tools.map((t) => {
                if (typeof t === 'string') {
                  return { toolId: t, isCustom: false }
                }
                return {
                  toolId: t.isCustom ? null : (t.toolId || null),
                  customName: t.isCustom ? t.customName : null,
                  isCustom: !!t.isCustom,
                }
              }),
            }
          : undefined,
      },
      include: {
        asset: true,
        technician: true,
        guideline: true,
        materials: {
          include: {
            inventoryItem: true,
          },
        },
        tools: {
          include: {
            tool: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/work-orders')
    revalidatePath('/dashboard/work-orders/new')
    revalidatePath('/dashboard')

    return { success: true, workOrder, message: 'Orden de trabajo creada exitosamente.' }
  } catch (error: any) {
    console.error('Error in createWorkOrder action:', error)
    return { success: false, error: error.message || 'Error al crear la orden de trabajo.' }
  }
}
