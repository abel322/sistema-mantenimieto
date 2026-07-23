import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@tu-dominio.com'
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa1L3Fm7G0aY8j_2W4Z5nK9q7t0u7-rX4G7Y8j_2W4Z5nK9q7t0u7'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'uK4Z5nK9q7t0u7_2W4Z5nK9q7t0u7-rX4G7Y8j'

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
} catch (err) {
  console.warn('VAPID setup warning in push-notifications:', err)
}

export async function sendPushToAllSubscribers(
  title: string,
  body: string,
  url: string = '/dashboard/inventory'
) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany()

    if (subscriptions.length === 0) {
      return
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
    })

    const sendPromises = subscriptions.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        .catch(async (err: any) => {
          // Remove expired or unsubscribed endpoints (410 Gone / 404)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          }
        })
    )

    await Promise.all(sendPromises)
  } catch (error) {
    console.error('Error sending push notifications:', error)
  }
}
