import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// Standard VAPID Keys for CMMS Pro Push Notifications
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa1L3Fm7G0aY8j_2W4Z5nK9q7t0u7-rX4G7Y8j_2W4Z5nK9q7t0u7'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'uK4Z5nK9q7t0u7_2W4Z5nK9q7t0u7-rX4G7Y8j'
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:soporte@cmmspro.com'

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
} catch (err) {
  console.warn('VAPID setup warning:', err)
}

export { VAPID_PUBLIC_KEY }

export async function sendPushNotificationToAll(payload: {
  title: string
  body: string
  url?: string
  icon?: string
}) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany()

    if (subscriptions.length === 0) {
      return { success: true, sentCount: 0 }
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      icon: payload.icon || '/icon-192.png',
    })

    let sentCount = 0

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          )
          sentCount++
        } catch (err: any) {
          // If subscription is expired/invalid (404 or 410), delete from DB
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            }).catch(() => {})
          }
        }
      })
    )

    return { success: true, sentCount }
  } catch (error) {
    console.error('Error sending push notifications to all:', error)
    return { success: false, error }
  }
}
