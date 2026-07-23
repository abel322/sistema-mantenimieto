import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ToolStatus, ToolType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tool = await prisma.tool.findUnique({
      where: { id: params.id },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            code: true,
            area: true,
          },
        },
      },
    })

    if (!tool) {
      return NextResponse.json(
        { error: 'Herramienta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(tool)
  } catch (error) {
    console.error('Error fetching tool:', error)
    return NextResponse.json(
      { error: 'Error al obtener los detalles de la herramienta' },
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
    const { action, ...updateData } = body

    // Handle specific workflow actions
    if (action === 'ASSIGN') {
      const { assignedTo, notes } = updateData
      if (!assignedTo) {
        return NextResponse.json(
          { error: 'Debe especificar a quién se asigna/presta la herramienta' },
          { status: 400 }
        )
      }

      const tool = await prisma.tool.update({
        where: { id: params.id },
        data: {
          status: 'IN_USE',
          assignedTo,
          assignedAt: new Date(),
          notes: notes !== undefined ? notes : undefined,
        },
        include: {
          asset: { select: { id: true, name: true, code: true, area: true } },
        },
      })
      return NextResponse.json(tool)
    }

    if (action === 'RETURN') {
      const tool = await prisma.tool.update({
        where: { id: params.id },
        data: {
          status: 'AVAILABLE',
          assignedTo: null,
          assignedAt: null,
        },
        include: {
          asset: { select: { id: true, name: true, code: true, area: true } },
        },
      })
      return NextResponse.json(tool)
    }

    // Standard field updates
    const dataToUpdate: any = {}
    if (updateData.code !== undefined) dataToUpdate.code = updateData.code
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name
    if (updateData.category !== undefined) dataToUpdate.category = updateData.category
    if (updateData.type !== undefined) dataToUpdate.type = updateData.type as ToolType
    if (updateData.status !== undefined) dataToUpdate.status = updateData.status as ToolStatus
    if (updateData.brand !== undefined) dataToUpdate.brand = updateData.brand || null
    if (updateData.serialNumber !== undefined) dataToUpdate.serialNumber = updateData.serialNumber || null
    if (updateData.assetId !== undefined) dataToUpdate.assetId = updateData.assetId || null
    if (updateData.area !== undefined) dataToUpdate.area = updateData.area || null
    if (updateData.assignedTo !== undefined) dataToUpdate.assignedTo = updateData.assignedTo || null
    if (updateData.assignedAt !== undefined) {
      dataToUpdate.assignedAt = updateData.assignedAt ? new Date(updateData.assignedAt) : null
    }
    if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes || null

    const updatedTool = await prisma.tool.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        asset: { select: { id: true, name: true, code: true, area: true } },
      },
    })

    return NextResponse.json(updatedTool)
  } catch (error) {
    console.error('Error updating tool:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la herramienta' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tool.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tool:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la herramienta' },
      { status: 500 }
    )
  }
}
