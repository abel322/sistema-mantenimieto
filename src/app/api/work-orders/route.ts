import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      type,
      priority,
      assetId,
      technicianId,
      externalVendorId,
      guidelineId,
      materials,
      tools,
    } = body

    const workOrder = await prisma.workOrder.create({
      data: {
        title,
        description,
        type,
        priority,
        assetId,
        technicianId,
        externalVendorId: externalVendorId || null,
        guidelineId: guidelineId || null,
        materials: Array.isArray(materials) && materials.length > 0
          ? {
              create: materials.map((m: any) => ({
                inventoryItemId: m.isCustom ? null : (m.inventoryItemId || null),
                customName: m.isCustom ? m.customName : null,
                isCustom: !!m.isCustom,
                quantityUsed: parseFloat(m.quantityUsed) || 1,
              })),
            }
          : undefined,
        tools: Array.isArray(tools) && tools.length > 0
          ? {
              create: tools.map((t: any) => {
                if (typeof t === 'string') {
                  return { toolId: t, isCustom: false }
                }
                return {
                  toolId: t.isCustom ? null : (t.toolId || null),
                  customName: t.isCustom ? t.customName : null,
                  isCustom: !!t.isCustom,
                }
              }),
            }
          : undefined,
      },
      include: {
        asset: true,
        technician: true,
        externalVendor: true,
        guideline: true,
        materials: {
          include: {
            inventoryItem: true,
          },
        },
        tools: {
          include: {
            tool: true,
          },
        },
      },
    })

    return NextResponse.json(workOrder, { status: 201 })
  } catch (error: any) {
    console.error('Error creating work order:', error)
    return NextResponse.json(
      { error: 'Error al crear la orden de trabajo: ' + (error.message || '') },
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
        guideline: true,
        materials: {
          include: {
            inventoryItem: true,
          },
        },
        tools: {
          include: {
            tool: true,
          },
        },
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
