import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerLowStockAlert } from '@/lib/notifications'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const part = await prisma.part.findUnique({
      where: { id: params.id },
      include: {
        preferredSupplier: true,
        assets: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        workOrders: {
          include: {
            workOrder: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    })

    if (!part) {
      return NextResponse.json(
        { error: 'Repuesto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(part)
  } catch (error) {
    console.error('Error fetching part:', error)
    return NextResponse.json(
      { error: 'Error al obtener el repuesto' },
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
    const { stock, adjustment } = body

    let newStock = stock

    if (adjustment !== undefined) {
      const currentPart = await prisma.part.findUnique({
        where: { id: params.id },
        select: { stock: true },
      })
      if (!currentPart) {
        return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 })
      }
      newStock = currentPart.stock + adjustment
    }

    const part = await prisma.part.update({
      where: { id: params.id },
      data: {
        stock: Math.max(0, newStock), // Prevent negative stock
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

    // Auto-trigger stock alert if at or below minStock
    await triggerLowStockAlert(part)

    return NextResponse.json(part)
  } catch (error) {
    console.error('Error updating part stock:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el stock del repuesto' },
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
    const { name, code, description, category, stock, minStock, unit, price, preferredSupplierId, assetIds } = body

    const updateData: any = {
      name,
      code,
      description: description || null,
      category,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 0,
      unit,
      price: parseFloat(price) || 0,
      preferredSupplierId: preferredSupplierId || null,
    }

    if (assetIds !== undefined) {
      updateData.assets = {
        set: Array.isArray(assetIds) ? assetIds.map((id: string) => ({ id })) : [],
      }
    }

    const part = await prisma.part.update({
      where: { id: params.id },
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

    // Auto-trigger stock alert if at or below minStock
    await triggerLowStockAlert(part)

    return NextResponse.json(part)
  } catch (error) {
    console.error('Error updating part details:', error)
    return NextResponse.json(
      { error: 'Error al editar el repuesto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.part.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Repuesto eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting part:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el repuesto' },
      { status: 500 }
    )
  }
}
