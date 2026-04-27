import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'

async function getSchedules() {
  return prisma.schedule.findMany({
    where: { isActive: true },
    orderBy: { nextDueDate: 'asc' },
    include: {
      asset: true,
    },
  })
}

const frequencyTypeLabels = {
  CALENDAR: 'Por Calendario',
  USAGE_HOURS: 'Por Horas de Uso',
  USAGE_METERS: 'Por Metros Producidos',
}

export async function ScheduleList() {
  const schedules = await getSchedules()

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const isOverdue = new Date(schedule.nextDueDate) < new Date()
        const isDueSoon =
          new Date(schedule.nextDueDate) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        return (
          <Card
            key={schedule.id}
            className={`${
              isOverdue
                ? 'border-destructive'
                : isDueSoon
                ? 'border-yellow-500'
                : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {schedule.asset.name}
                    </h3>
                    <Badge
                      variant={
                        isOverdue
                          ? 'destructive'
                          : isDueSoon
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {isOverdue
                        ? 'Vencido'
                        : isDueSoon
                        ? 'Próximo'
                        : 'Programado'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {schedule.taskTemplate}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(schedule.nextDueDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {frequencyTypeLabels[schedule.frequencyType]}
                    </span>
                    {schedule.frequencyDays && (
                      <span>Cada {schedule.frequencyDays} días</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {schedules.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay programaciones de mantenimiento activas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
