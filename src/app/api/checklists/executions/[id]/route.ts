import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const execution = await prisma.checklistExecution.findUnique({
      where: { id: params.id },
      include: {
        template: {
          include: { items: true },
        },
        asset: true,
        technician: true,
        responses: {
          include: { item: true },
        },
        workOrders: true,
      },
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(execution)
  } catch (error) {
    console.error('Error fetching execution details:', error)
    return NextResponse.json(
      { error: 'Error al obtener el detalle de la inspección' },
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
    const { status, notes, responses } = body

    const updated = await prisma.$transaction(async (tx) => {
      const exec = await tx.checklistExecution.update({
        where: { id: params.id },
        data: {
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      })

      if (responses && Array.isArray(responses)) {
        for (const resp of responses) {
          if (resp.id) {
            await tx.checklistResponse.update({
              where: { id: resp.id },
              data: {
                ...(resp.valueBoolean !== undefined ? { valueBoolean: resp.valueBoolean } : {}),
                ...(resp.valueNumeric !== undefined ? { valueNumeric: resp.valueNumeric } : {}),
                ...(resp.valueText !== undefined ? { valueText: resp.valueText } : {}),
                ...(resp.notes !== undefined ? { notes: resp.notes } : {}),
                ...(resp.isFlagged !== undefined ? { isFlagged: resp.isFlagged } : {}),
              },
            })
          }
        }
      }

      return exec
    })

    return NextResponse.json({
      success: true,
      execution: updated,
      message: 'Registro de inspección actualizado.',
    })
  } catch (error: any) {
    console.error('Error updating execution:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la inspección' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.workOrder.updateMany({
      where: { checklistExecutionId: params.id },
      data: { checklistExecutionId: null },
    })

    await prisma.checklistExecution.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Inspección eliminada correctamente.',
    })
  } catch (error: any) {
    console.error('Error deleting execution:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la inspección' },
      { status: 500 }
    )
  }
}
