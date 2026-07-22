import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AssetArea } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            workOrders: true,
            failureLogs: true,
            schedules: true,
            maintenanceLogs: true,
            checklistExecutions: true,
          },
        },
      },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Activo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json(
      { error: 'Error al obtener el activo' },
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
    const { name, code, area, criticality, description, imageUrl } = body

    if (!name || !code || !area) {
      return NextResponse.json(
        { error: 'Nombre, código y área son obligatorios' },
        { status: 400 }
      )
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        name,
        code,
        area: area as AssetArea,
        criticality: typeof criticality === 'number' ? criticality : parseInt(criticality),
        description: description || null,
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json(updatedAsset)
  } catch (error: any) {
    console.error('Error updating asset:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un activo registrado con este código' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar el activo' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingAsset = await prisma.asset.findUnique({
      where: { id: params.id },
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'El activo no existe o ya fue eliminado' },
        { status: 404 }
      )
    }

    await prisma.asset.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Activo eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el activo. Verifique que no existan dependencias bloqueantes.' },
      { status: 500 }
    )
  }
}
