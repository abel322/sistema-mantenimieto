import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id },
      include: { asset: true },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Programación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Error al obtener la programación' },
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
    const { assetId, frequencyDays, frequencyType, nextDueDate, taskTemplate, isActive } = body

    const schedule = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        assetId,
        frequencyDays: parseInt(frequencyDays) || 30,
        frequencyType,
        nextDueDate: new Date(nextDueDate),
        taskTemplate,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la programación' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.schedule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Programación eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la programación' },
      { status: 500 }
    )
  }
}
