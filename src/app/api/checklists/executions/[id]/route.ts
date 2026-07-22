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
