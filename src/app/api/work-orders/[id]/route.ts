import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        asset: true,
        technician: true,
        externalVendor: true,
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
        partsUsed: {
          include: {
            part: true,
          },
        },
        taskPlan: true,
      },
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error('Error fetching work order:', error)
    return NextResponse.json(
      { error: 'Error al obtener la orden de trabajo' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, closedAt } = body

    const existingWO = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        materials: true,
        partsUsed: true,
      },
    })

    if (!existingWO) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    const isClosing = status === 'CLOSED' && existingWO.status !== 'CLOSED'

    const workOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: params.id },
        data: {
          ...(status && { status }),
          ...(closedAt !== undefined && { closedAt: closedAt ? new Date(closedAt) : null }),
        },
      })

      if (isClosing) {
        // Discount stock for WorkOrderMaterial
        for (const mat of existingWO.materials) {
          if (mat.inventoryItemId && mat.quantityUsed > 0) {
            await tx.part.update({
              where: { id: mat.inventoryItemId },
              data: {
                stock: {
                  decrement: Math.max(1, Math.round(mat.quantityUsed)),
                },
              },
            })
          }
        }
        // Discount stock for PartsUsed if any
        for (const partOnOrder of existingWO.partsUsed) {
          if (partOnOrder.partId && partOnOrder.quantity > 0) {
            await tx.part.update({
              where: { id: partOnOrder.partId },
              data: {
                stock: {
                  decrement: partOnOrder.quantity,
                },
              },
            })
          }
        }
      }

      return updated
    })

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error('Error updating work order status:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el estado de la orden de trabajo' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, assetId, priority, type, technicianId, status, laborHours, externalVendorId, guidelineId } = body

    const existingWO = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        materials: true,
        partsUsed: true,
      },
    })

    if (!existingWO) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    const isClosing = status === 'CLOSED' && existingWO.status !== 'CLOSED'

    const workOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: params.id },
        data: {
          title,
          description,
          assetId,
          priority,
          type,
          technicianId,
          status,
          guidelineId: guidelineId !== undefined ? (guidelineId || null) : undefined,
          laborHours: laborHours !== undefined ? parseFloat(laborHours) : undefined,
          externalVendorId: externalVendorId || null,
          closedAt: status === 'CLOSED' ? new Date() : null,
        },
      })

      if (isClosing) {
        // Discount stock for WorkOrderMaterial
        for (const mat of existingWO.materials) {
          if (mat.inventoryItemId && mat.quantityUsed > 0) {
            await tx.part.update({
              where: { id: mat.inventoryItemId },
              data: {
                stock: {
                  decrement: Math.max(1, Math.round(mat.quantityUsed)),
                },
              },
            })
          }
        }
        // Discount stock for PartsUsed if any
        for (const partOnOrder of existingWO.partsUsed) {
          if (partOnOrder.partId && partOnOrder.quantity > 0) {
            await tx.part.update({
              where: { id: partOnOrder.partId },
              data: {
                stock: {
                  decrement: partOnOrder.quantity,
                },
              },
            })
          }
        }
      }

      return updated
    })

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error('Error updating work order details:', error)
    return NextResponse.json(
      { error: 'Error al editar la orden de trabajo' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.workOrder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Orden de trabajo eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting work order:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la orden de trabajo' },
      { status: 500 }
    )
  }
}
