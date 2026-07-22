'use client'

import { AssetForm, AssetData } from './asset-form'
import { X } from 'lucide-react'

interface AssetEditModalProps {
  isOpen: boolean
  asset: AssetData
  onClose: () => void
  onSuccess: () => void
}

export function AssetEditModal({ isOpen, asset, onClose, onSuccess }: AssetEditModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative bg-background border rounded-lg shadow-xl w-full max-w-2xl my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors z-10"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        <AssetForm
          initialData={asset}
          onSuccess={() => {
            onSuccess()
            onClose()
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
