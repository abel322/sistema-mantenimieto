import { prisma } from '@/lib/prisma'

export async function createNotification(data: {
  title: string
  message: string
  type: 'STOCK_ALERT' | 'SCHEDULE_DUE' | 'WORK_ORDER_OVERDUE'
  link?: string
}) {
  try {
    // Check if an unread notification with the same title & type exists created within the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const existing = await prisma.notification.findFirst({
      where: {
        title: data.title,
        type: data.type,
        isRead: false,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    })

    if (existing) {
      return existing
    }

    return await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
      },
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function triggerLowStockAlert(part: {
  id: string
  name: string
  code: string
  stock: number
  minStock: number
}) {
  if (part.stock <= part.minStock) {
    const isOutOfStock = part.stock === 0
    const title = isOutOfStock
      ? `Agotado: ${part.name}`
      : `Stock Bajo: ${part.name}`
    const message = isOutOfStock
      ? `El repuesto (${part.code}) se ha agotado por completo en inventario.`
      : `El stock actual (${part.stock}) está en o por debajo del mínimo permitido (${part.minStock}).`

    await createNotification({
      title,
      message,
      type: 'STOCK_ALERT',
      link: '/dashboard/inventory',
    })
  }
}
