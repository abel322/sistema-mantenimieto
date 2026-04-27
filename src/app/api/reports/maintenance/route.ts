import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener estadísticas
    const [totalWorkOrders, openWorkOrders, totalAssets, lowStockParts] =
      await Promise.all([
        prisma.workOrder.count(),
        prisma.workOrder.count({ where: { status: { not: 'CLOSED' } } }),
        prisma.asset.count(),
        prisma.part.count({
          where: {
            stock: {
              lte: prisma.part.fields.minStock,
            },
          },
        }),
      ])

    // Calcular MTTR
    const closedOrders = await prisma.workOrder.findMany({
      where: { status: 'CLOSED', laborHours: { not: null } },
      select: { laborHours: true },
    })

    const mttr =
      closedOrders.length > 0
        ? closedOrders.reduce((acc, order) => acc + (order.laborHours || 0), 0) /
          closedOrders.length
        : 0

    // Distribución de mantenimiento
    const workOrders = await prisma.workOrder.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    })

    const preventive = workOrders.find((wo) => wo.type === 'PREVENTIVE')?._count.id || 0
    const corrective = workOrders.find((wo) => wo.type === 'CORRECTIVE')?._count.id || 0
    const predictive = workOrders.find((wo) => wo.type === 'PREDICTIVE')?._count.id || 0
    const total = preventive + corrective + predictive

    const pmpPercentage = total > 0 ? ((preventive / total) * 100).toFixed(1) : '0'

    // Top fallas
    const failures = await prisma.failureLog.groupBy({
      by: ['assetId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    })

    const topFailures = await Promise.all(
      failures.map(async (failure) => {
        const asset = await prisma.asset.findUnique({
          where: { id: failure.assetId },
        })
        return {
          asset: asset?.name || 'Desconocido',
          count: failure._count.id,
        }
      })
    )

    // Órdenes recientes
    const recentWorkOrders = await prisma.workOrder.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: true,
        technician: true,
      },
    })

    return NextResponse.json({
      totalWorkOrders,
      openWorkOrders,
      totalAssets,
      lowStockParts,
      mttr: mttr.toFixed(1),
      preventive,
      corrective,
      predictive,
      total,
      pmpPercentage,
      topFailures,
      recentWorkOrders,
    })
  } catch (error) {
    console.error('Error fetching maintenance report data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del reporte' },
      { status: 500 }
    )
  }
}
