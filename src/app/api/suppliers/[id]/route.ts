import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        parts: true,
        workOrders: {
          include: {
            asset: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Error al obtener los detalles del proveedor' },
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
    const {
      name,
      taxId,
      category,
      contactName,
      phone,
      email,
      address,
      status,
      rating,
      notes,
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'El nombre comercial y la categoría son obligatorios' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name,
        taxId: taxId || null,
        category,
        contactName: contactName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        status: status || 'ACTIVE',
        rating: rating !== undefined && rating !== null ? parseInt(rating) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el proveedor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.supplier.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Proveedor eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el proveedor' },
      { status: 500 }
    )
  }
}
