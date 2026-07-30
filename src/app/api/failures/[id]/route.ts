import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const failureLog = await prisma.failureLog.findUnique({
      where: { id: params.id },
      include: {
        asset: true,
      },
    })

    if (!failureLog) {
      return NextResponse.json(
        { error: 'Registro de falla no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(failureLog)
  } catch (error) {
    console.error('Error fetching failure log:', error)
    return NextResponse.json(
      { error: 'Error al obtener el registro de falla' },
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
    const { symptom, rootCause, downtimeHours, reportedAt, resolvedAt, assetId } = body

    if (!symptom) {
      return NextResponse.json(
        { error: 'El síntoma de la falla es obligatorio' },
        { status: 400 }
      )
    }

    const updateData: any = {
      symptom,
      rootCause: rootCause || null,
      downtimeHours: parseFloat(downtimeHours) || 0,
    }

    if (reportedAt) updateData.reportedAt = new Date(reportedAt)
    if (resolvedAt !== undefined) updateData.resolvedAt = resolvedAt ? new Date(resolvedAt) : null
    if (assetId) updateData.assetId = assetId

    const failureLog = await prisma.failureLog.update({
      where: { id: params.id },
      data: updateData,
      include: {
        asset: true,
      },
    })

    return NextResponse.json(failureLog)
  } catch (error) {
    console.error('Error updating failure log:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el registro de falla' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.failureLog.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Registro de falla eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting failure log:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el registro de falla' },
      { status: 500 }
    )
  }
}
