import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        workOrders: {
          include: {
            technician: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        failureLogs: {
          orderBy: {
            reportedAt: 'desc',
          },
        },
        maintenanceLogs: {
          orderBy: {
            executionDate: 'desc',
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
    console.error('Error fetching asset report data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del activo' },
      { status: 500 }
    )
  }
}
