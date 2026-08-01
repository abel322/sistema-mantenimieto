'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Package, Wrench } from 'lucide-react'
import { InventoryList } from '@/components/inventory/inventory-list'
import { ToolsList } from '@/components/tools/tools-list'
import { NewItemModal } from '@/components/inventory/new-item-modal'

export function InventoryView() {
  const [activeTab, setActiveTab] = useState<'parts' | 'tools'>('parts')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex-1 space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-6 w-full max-w-full overflow-hidden">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {activeTab === 'parts' ? 'Inventario de Repuestos' : 'Control de Herramientas'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeTab === 'parts'
              ? 'Gestión de stock, consumibles y repuestos críticos de planta.'
              : 'Control de préstamos, asignación a técnicos y estado de herramientas.'}
          </p>
        </div>

        {activeTab === 'parts' && (
          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="w-full sm:w-auto shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Repuesto
          </Button>
        )}
      </div>

      <NewItemModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Tabs Navigation */}
      <div className="border-b border-border overflow-x-auto max-w-full">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 min-w-max pb-0.5" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'parts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>📦 Repuestos y Consumibles</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'tools'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>🔧 Control de Herramientas</span>
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'parts' ? (
        <InventoryList key={refreshKey} />
      ) : (
        <ToolsList />
      )}
    </div>
  )
}
