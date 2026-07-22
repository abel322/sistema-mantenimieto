import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const executions = await prisma.checklistExecution.findMany({
      include: {
        template: {
          select: { id: true, title: true, assetType: true },
        },
        asset: {
          select: { id: true, name: true, code: true, area: true },
        },
        technician: {
          select: { id: true, name: true, email: true },
        },
        responses: {
          include: {
            item: true,
          },
        },
        workOrders: {
          select: { id: true, title: true, status: true, priority: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json(executions)
  } catch (error) {
    console.error('Error fetching checklist executions:', error)
    return NextResponse.json(
      { error: 'Error al obtener las ejecuciones de inspección' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { templateId, assetId, technicianId, notes, responses } = body

    if (!templateId || !assetId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'La plantilla, el activo y las respuestas son obligatorios' },
        { status: 400 }
      )
    }

    // Get asset details
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    })
    if (!asset) {
      return NextResponse.json(
        { error: 'El activo seleccionado no existe' },
        { status: 404 }
      )
    }

    // Get template details with items
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: true },
    })
    if (!template) {
      return NextResponse.json(
        { error: 'La plantilla de inspección no existe' },
        { status: 404 }
      )
    }

    // Find default technician if none provided
    let techId = technicianId
    if (!techId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'TECHNICIAN' },
      })
      if (defaultUser) {
        techId = defaultUser.id
      } else {
        const anyUser = await prisma.user.findFirst()
        techId = anyUser?.id
      }
    }

    // Evaluate responses against template rules
    const failedDescriptions: string[] = []
    const processedResponses = responses.map((res: any) => {
      const item = template.items.find((i) => i.id === res.itemId)
      let isFlagged = false
      let failureReason = ''

      if (item) {
        if (item.type === 'BOOLEAN') {
          if (res.valueBoolean === false) {
            isFlagged = true
            failureReason = `Estado marcado como NO OK / Anómalo`
          }
        } else if (item.type === 'NUMERIC' && res.valueNumeric !== undefined && res.valueNumeric !== null) {
          const val = parseFloat(res.valueNumeric)
          if (item.minValue !== null && val < item.minValue) {
            isFlagged = true
            failureReason = `Valor ${val} está por debajo del mínimo requerido (${item.minValue})`
          } else if (item.maxValue !== null && val > item.maxValue) {
            isFlagged = true
            failureReason = `Valor ${val} supera el máximo permitido (${item.maxValue})`
          }
        }
      }

      if (isFlagged && item) {
        failedDescriptions.push(`- **${item.label}**: ${failureReason}`)
      }

      return {
        itemId: res.itemId,
        valueBoolean: res.valueBoolean ?? null,
        valueNumeric: res.valueNumeric !== undefined && res.valueNumeric !== null && res.valueNumeric !== '' ? parseFloat(res.valueNumeric) : null,
        valueText: res.valueText || null,
        isFlagged,
        notes: res.notes || null,
      }
    })

    const hasFailedItems = processedResponses.some((r) => r.isFlagged)
    const executionStatus = hasFailedItems ? 'FAILED' : 'PASSED'

    // Create execution and responses in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const execution = await tx.checklistExecution.create({
        data: {
          templateId,
          assetId,
          technicianId: techId,
          status: executionStatus,
          notes: notes || null,
          completedAt: new Date(),
          responses: {
            create: processedResponses,
          },
        },
        include: {
          asset: true,
          template: true,
          technician: true,
          responses: { include: { item: true } },
        },
      })

      let autoWorkOrder = null

      // Automatically generate Work Order if inspection failed
      if (hasFailedItems) {
        const woTitle = `[Auto-Inspección] Falla en ${asset.name} (${asset.code})`
        const woDescription = `Orden de trabajo generada automáticamente por fallas detectadas en inspección "${template.title}".\n\nDetalle de fallas:\n${failedDescriptions.join('\n')}\n\nObservaciones del técnico: ${notes || 'Sin observaciones'}`

        autoWorkOrder = await tx.workOrder.create({
          data: {
            title: woTitle,
            description: woDescription,
            type: 'CORRECTIVE',
            status: 'OPEN',
            priority: 'HIGH',
            assetId: asset.id,
            technicianId: techId,
            checklistExecutionId: execution.id,
          },
        })
      }

      return { execution, autoWorkOrder }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error recording checklist execution:', error)
    return NextResponse.json(
      { error: 'Error al registrar la inspección' },
      { status: 500 }
    )
  }
}
