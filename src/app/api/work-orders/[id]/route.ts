import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, closedAt } = body

    const workOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
        status,
        closedAt: closedAt ? new Date(closedAt) : null,
      },
    })

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error('Error updating work order:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la orden de trabajo' },
      { status: 500 }
    )
  }
}

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
        partsUsed: {
          include: {
            part: true,
          },
        },
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
