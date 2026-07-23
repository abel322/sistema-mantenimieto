import { NextResponse } from 'next/server'
import { sendPushNotificationToAll } from '@/lib/web-push'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, body: pushBody, url } = body

    const result = await sendPushNotificationToAll({
      title: title || '⚠️ Alerta CMMS Pro',
      body: pushBody || 'Notificación del sistema de mantenimiento.',
      url: url || '/dashboard',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Error al enviar notificación push' },
      { status: 500 }
    )
  }
}
