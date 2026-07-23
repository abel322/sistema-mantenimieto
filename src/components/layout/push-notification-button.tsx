'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BellRing, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationButton() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)

      if (Notification.permission === 'denied') {
        setPermissionDenied(true)
      }

      // Register SW & check existing subscription
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setSubscribed(true)
          }
        })
      }).catch((err) => {
        console.error('Service worker registration error:', err)
      })
    }
  }, [])

  const handleSubscribe = async () => {
    if (!supported) return
    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setPermissionDenied(true)
        setLoading(false)
        return
      }

      // Fetch VAPID Public Key
      const keyRes = await fetch('/api/push/vapid-public-key')
      const { publicKey } = await keyRes.json()

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Send subscription to server
      const subRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })

      if (subRes.ok) {
        setSubscribed(true)
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  if (permissionDenied) {
    return (
      <Badge variant="outline" className="text-[11px] text-muted-foreground gap-1 hidden sm:flex">
        <AlertCircle className="w-3 h-3 text-destructive" /> Push Bloqueadas
      </Badge>
    )
  }

  if (subscribed) {
    return (
      <Badge variant="outline" className="text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 hidden sm:flex">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Push Activas
      </Badge>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-sm"
      onClick={handleSubscribe}
      disabled={loading}
      title="Recibir alertas en tiempo real en tu celular"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <BellRing className="w-3.5 h-3.5 text-primary" />
      )}
      <span className="hidden sm:inline">Activar Push</span>
    </Button>
  )
}
