import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, type, priority, assetId, technicianId, externalVendorId } = body

    const workOrder = await prisma.workOrder.create({
      data: {
        title,
        description,
        type,
        priority,
        assetId,
        technicianId,
        externalVendorId: externalVendorId || null,
      },
    })

    return NextResponse.json(workOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating work order:', error)
    return NextResponse.json(
      { error: 'Error al crear la orden de trabajo' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        asset: true,
        technician: true,
        externalVendor: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(workOrders)
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { error: 'Error al obtener las órdenes de trabajo' },
      { status: 500 }
    )
  }
}
