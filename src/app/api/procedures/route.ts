import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assetType = searchParams.get('assetType')
    const frequency = searchParams.get('frequency')

    const where: any = {}
    if (assetType && assetType !== 'ALL') {
      where.assetType = assetType
    }
    if (frequency && frequency !== 'ALL') {
      where.frequency = frequency
    }

    const plans = await prisma.taskPlan.findMany({
      where,
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        materials: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
                code: true,
                stock: true,
                minStock: true,
                unit: true,
              },
            },
          },
        },
        workOrders: {
          take: 3,
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching task plans:', error)
    return NextResponse.json(
      { error: 'Error al obtener las pautas técnicas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      assetType,
      frequency,
      estimatedMinutes,
      machineStatus,
      requiredSkill,
      tools,
      safetyEquipment,
      steps,
      materials,
    } = body

    if (!title || !assetType || !frequency || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'Título, área de activo, frecuencia y al menos un paso son obligatorios' },
        { status: 400 }
      )
    }

    const plan = await prisma.taskPlan.create({
      data: {
        title,
        description: description || null,
        assetType,
        frequency,
        estimatedMinutes: parseInt(estimatedMinutes) || 30,
        machineStatus: machineStatus || 'STOPPED_LOTO',
        requiredSkill: requiredSkill || 'Técnico General',
        tools: Array.isArray(tools) ? tools : [],
        safetyEquipment: Array.isArray(safetyEquipment) ? safetyEquipment : [],
        steps: {
          create: steps.map((step: any, idx: number) => ({
            stepNumber: step.stepNumber || idx + 1,
            description: step.description,
            referenceVal: step.referenceVal || null,
            isMandatory: step.isMandatory ?? true,
          })),
        },
        materials: materials && Array.isArray(materials) ? {
          create: materials.map((mat: any) => ({
            partId: mat.partId || null,
            materialName: mat.materialName,
            quantity: parseFloat(mat.quantity) || 1,
            unit: mat.unit || 'unidad',
          })),
        } : undefined,
      },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
        materials: { include: { part: true } },
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating task plan:', error)
    return NextResponse.json(
      { error: 'Error al crear la pauta técnica' },
      { status: 500 }
    )
  }
}
