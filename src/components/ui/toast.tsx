'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type?: 'success' | 'error' | 'info'
}

interface ToastProps {
  toast: ToastMessage | null
  onClose: () => void
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const isSuccess = toast.type === 'success' || !toast.type
  const isError = toast.type === 'error'

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border max-w-md bg-background ${
          isSuccess
            ? 'border-green-500/50 text-foreground'
            : isError
            ? 'border-red-500/50 text-foreground'
            : 'border-blue-500/50 text-foreground'
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
        {isError && <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
