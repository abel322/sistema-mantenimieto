import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification, triggerLowStockAlert } from '@/lib/notifications'

export async function GET() {
  try {
    const now = new Date()
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // 1. Check Schedules due within next 24h or overdue
    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          lte: in24Hours,
        },
      },
      include: {
        asset: true,
      },
    })

    let scheduleNotifsCreated = 0
    for (const sch of upcomingSchedules) {
      const isPast = sch.nextDueDate < now
      const title = isPast
        ? `Rutina Vencida: ${sch.asset.name}`
        : `Rutina Próxima: ${sch.asset.name}`
      const message = `${sch.taskTemplate} (Vence: ${new Date(sch.nextDueDate).toLocaleDateString('es-ES')})`

      const created = await createNotification({
        title,
        message,
        type: 'SCHEDULE_DUE',
        link: '/dashboard/schedule',
      })
      if (created) scheduleNotifsCreated++
    }

    // 2. Check Overdue Open Work Orders (e.g. Created over 48h ago or with HIGH/CRITICAL priority open for >24h)
    const overdueWorkOrders = await prisma.workOrder.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
        createdAt: {
          lte: new Date(Date.now() - 48 * 60 * 60 * 1000), // open for > 48h
        },
      },
      include: {
        asset: true,
      },
      take: 20,
    })

    let woNotifsCreated = 0
    for (const wo of overdueWorkOrders) {
      const created = await createNotification({
        title: `Orden Pendiente: OT #${wo.id.slice(0, 6)}`,
        message: `${wo.title} en activo ${wo.asset.name} sigue sin completarse.`,
        type: 'WORK_ORDER_OVERDUE',
        link: `/dashboard/work-orders/${wo.id}`,
      })
      if (created) woNotifsCreated++
    }

    // 3. Check Parts low stock
    const lowStockParts = await prisma.part.findMany({
      where: {
        stock: {
          lte: prisma.part.fields.minStock,
        },
      },
    })

    for (const part of lowStockParts) {
      await triggerLowStockAlert(part)
    }

    return NextResponse.json({
      success: true,
      schedulesChecked: upcomingSchedules.length,
      scheduleNotifsCreated,
      overdueWorkOrdersChecked: overdueWorkOrders.length,
      woNotifsCreated,
      lowStockPartsChecked: lowStockParts.length,
    })
  } catch (error) {
    console.error('Error running schedule/overdue check:', error)
    return NextResponse.json(
      { error: 'Error al verificar programaciones y paros' },
      { status: 500 }
    )
  }
}
