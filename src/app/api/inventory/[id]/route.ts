import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { stock } = body

    const part = await prisma.part.update({
      where: { id: params.id },
      data: {
        stock: Math.max(0, stock), // No permitir stock negativo
      },
    })

    return NextResponse.json(part)
  } catch (error) {
    console.error('Error updating part:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el repuesto' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const part = await prisma.part.findUnique({
      where: { id: params.id },
      include: {
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
