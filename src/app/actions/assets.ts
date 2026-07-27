'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { AssetArea } from '@prisma/client'

export async function updateAsset(
  id: string,
  data: {
    name: string
    code: string
    area: string
    criticality: number
    description?: string | null
    imageUrl?: string | null
  }
) {
  try {
    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        area: data.area as AssetArea,
        criticality: typeof data.criticality === 'number' ? data.criticality : parseInt(data.criticality as any),
        description: data.description || null,
        imageUrl: data.imageUrl || null,
      },
    })

    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard/activos')
    revalidatePath(`/dashboard/assets/${id}`)
    revalidatePath('/dashboard/work-orders/new')
    revalidatePath('/dashboard/work-orders')
    revalidatePath('/dashboard/schedule/new')
    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard/checklists/new')
    revalidatePath('/dashboard/checklists')

    return { success: true, asset: updated, message: 'Activo actualizado correctamente.' }
  } catch (error: any) {
    console.error('Error updating asset action:', error)
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un activo registrado con este código' }
    }
    return { success: false, error: error.message || 'Error al actualizar el activo' }
  }
}

export async function deleteAsset(id: string) {
  try {
    const existing = await prisma.asset.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: 'El activo no existe o ya fue eliminado' }
    }

    await prisma.asset.delete({
      where: { id },
    })

    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard/activos')
    revalidatePath('/dashboard/work-orders/new')
    revalidatePath('/dashboard/work-orders')
    revalidatePath('/dashboard/schedule/new')
    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard/checklists/new')
    revalidatePath('/dashboard/checklists')

    return { success: true, message: `El activo "${existing.name}" fue eliminado del sistema.` }
  } catch (error: any) {
    console.error('Error deleting asset action:', error)
    return { success: false, error: error.message || 'Error al eliminar el activo.' }
  }
}
