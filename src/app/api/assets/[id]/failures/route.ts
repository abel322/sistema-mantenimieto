import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { symptom, rootCause, downtimeHours, reportedAt } = body

    if (!symptom) {
      return NextResponse.json(
        { error: 'El síntoma o descripción de la falla es obligatorio' },
        { status: 400 }
      )
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'El activo especificado no existe' },
        { status: 404 }
      )
    }

    const failureLog = await prisma.failureLog.create({
      data: {
        assetId: params.id,
        symptom,
        rootCause: rootCause || null,
        downtimeHours: parseFloat(downtimeHours) || 0,
        reportedAt: reportedAt ? new Date(reportedAt) : new Date(),
      },
    })

    return NextResponse.json(failureLog, { status: 201 })
  } catch (error) {
    console.error('Error logging failure event:', error)
    return NextResponse.json(
      { error: 'Error al registrar el evento de falla' },
      { status: 500 }
    )
  }
}
