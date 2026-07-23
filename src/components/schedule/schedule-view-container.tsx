'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScheduleCalendar } from '@/components/schedule/schedule-calendar'
import { ScheduleList } from '@/components/schedule/schedule-list'
import { Calendar, List, Plus } from 'lucide-react'
import Link from 'next/link'

export function ScheduleViewContainer() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Top Bar Header with View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b pb-4 w-full">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Programación de Mantenimiento
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Calendario interactivo de rutinas preventivas y órdenes de trabajo en planta.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center justify-center border rounded-lg p-1 bg-muted/40 w-full sm:w-auto">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex-1 sm:flex-none text-xs flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" /> Calendario
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex-1 sm:flex-none text-xs flex items-center justify-center gap-1.5"
            >
              <List className="w-4 h-4" /> Lista
            </Button>
          </div>

          <Link href="/dashboard/schedule/new" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="mr-1.5 h-4 w-4" /> Nueva Programación
            </Button>
          </Link>
        </div>
      </div>

      {/* Render Active View */}
      {viewMode === 'calendar' ? <ScheduleCalendar /> : <ScheduleList />}
    </div>
  )
}
