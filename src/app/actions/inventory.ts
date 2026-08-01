'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { triggerLowStockAlert } from '@/lib/notifications'

export interface InventoryItemPayload {
  name: string
  code: string
  description?: string | null
  stock: number | string
  minStock: number | string
  price?: number | string
  unitPrice?: number | string
  unit?: string | null
  location?: string | null
  category?: string | null
  preferredSupplierId?: string | null
  assetIds?: string[]
}

export async function createInventoryItem(payload: InventoryItemPayload) {
  try {
    const name = payload.name?.trim() || ''
    const code = payload.code?.trim() || ''
    const description = payload.description?.trim() || null
    const stock = parseInt(String(payload.stock)) || 0
    const minStock = parseInt(String(payload.minStock)) || 0
    const price = parseFloat(String(payload.price ?? payload.unitPrice ?? 0)) || 0
    const unit = payload.unit?.trim() || 'pieza'
    const location = payload.location?.trim() || null
    const category = payload.category?.trim() || null
    const preferredSupplierId = payload.preferredSupplierId?.trim() || null
    const validAssetIds = Array.isArray(payload.assetIds)
      ? payload.assetIds.filter(Boolean)
      : []

    if (!name || !code) {
      return {
        success: false,
        error: 'El nombre y el código del repuesto son obligatorios.',
      }
    }

    const partData: any = {
      name,
      code,
      description,
      stock,
      minStock,
      price,
      unit,
      location,
      category,
      preferredSupplierId,
      assets:
        validAssetIds.length > 0
          ? { connect: validAssetIds.map((id) => ({ id })) }
          : undefined,
    }

    const part = await prisma.part.create({
      data: partData,
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
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'El Código SKU ya se encuentra registrado en el sistema.',
      }
    }
    return {
      success: false,
      error: error.message || 'Error al crear el repuesto.',
    }
  }
}

export async function updateInventoryItem(
  id: string,
  payload: Partial<InventoryItemPayload>
) {
  try {
    const updateData: any = {}

    if (payload.name !== undefined) updateData.name = payload.name.trim()
    if (payload.code !== undefined) updateData.code = payload.code.trim()
    if (payload.description !== undefined)
      updateData.description = payload.description?.trim() || null
    if (payload.stock !== undefined)
      updateData.stock = parseInt(String(payload.stock)) || 0
    if (payload.minStock !== undefined)
      updateData.minStock = parseInt(String(payload.minStock)) || 0
    if (payload.price !== undefined || payload.unitPrice !== undefined)
      updateData.price =
        parseFloat(String(payload.price ?? payload.unitPrice ?? 0)) || 0
    if (payload.unit !== undefined)
      updateData.unit = payload.unit?.trim() || 'pieza'
    if (payload.location !== undefined)
      updateData.location = payload.location?.trim() || null
    if (payload.category !== undefined)
      updateData.category = payload.category?.trim() || null
    if (payload.preferredSupplierId !== undefined)
      updateData.preferredSupplierId =
        payload.preferredSupplierId?.trim() || null

    if (payload.assetIds !== undefined) {
      const validIds = Array.isArray(payload.assetIds)
        ? payload.assetIds.filter(Boolean)
        : []
      updateData.assets = {
        set: validIds.map((assetId) => ({ id: assetId })),
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
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'El Código SKU ya se encuentra registrado en el sistema.',
      }
    }
    return {
      success: false,
      error: error.message || 'Error al actualizar el repuesto.',
    }
  }
}
