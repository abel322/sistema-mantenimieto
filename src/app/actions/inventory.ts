'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { triggerLowStockAlert } from '@/lib/notifications'

export interface InventoryItemPayload {
  name: string
  code: string
  stock: number
  minStock: number
  price: number
  unit: string
  category?: string | null
  preferredSupplierId?: string | null
  assetIds?: string[]
}

export async function createInventoryItem(payload: InventoryItemPayload) {
  try {
    const {
      name,
      code,
      stock,
      minStock,
      price,
      unit,
      category,
      preferredSupplierId,
      assetIds = [],
    } = payload

    const part = await prisma.part.create({
      data: {
        name,
        code,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        price: Number(price) || 0,
        unit,
        category: category || null,
        preferredSupplierId: preferredSupplierId || null,
        assets: assetIds.length > 0 ? {
          connect: assetIds.map((id) => ({ id })),
        } : undefined,
      },
      include: {
        preferredSupplier: true,
        assets: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/assets')
    return { success: true, part }
  } catch (error: any) {
    console.error('Error in createInventoryItem action:', error)
    return { success: false, error: error.message || 'Error al crear el repuesto' }
  }
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItemPayload>) {
  try {
    const {
      name,
      code,
      stock,
      minStock,
      price,
      unit,
      category,
      preferredSupplierId,
      assetIds,
    } = payload

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (stock !== undefined) updateData.stock = Number(stock) || 0
    if (minStock !== undefined) updateData.minStock = Number(minStock) || 0
    if (price !== undefined) updateData.price = Number(price) || 0
    if (unit !== undefined) updateData.unit = unit
    if (category !== undefined) updateData.category = category || null
    if (preferredSupplierId !== undefined) updateData.preferredSupplierId = preferredSupplierId || null

    if (assetIds !== undefined) {
      updateData.assets = {
        set: assetIds.map((assetId) => ({ id: assetId })),
      }
    }

    const part = await prisma.part.update({
      where: { id },
      data: updateData,
      include: {
        preferredSupplier: true,
        assets: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    await triggerLowStockAlert(part)

    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/assets')
    revalidatePath(`/dashboard/assets/${id}`)
    return { success: true, part }
  } catch (error: any) {
    console.error('Error in updateInventoryItem action:', error)
    return { success: false, error: error.message || 'Error al actualizar el repuesto' }
  }
}
