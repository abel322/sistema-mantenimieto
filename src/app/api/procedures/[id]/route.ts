import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.taskPlan.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        materials: {
          include: {
            part: true,
          },
        },
        workOrders: {
          include: {
            asset: true,
            technician: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Pauta técnica no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error fetching task plan:', error)
    return NextResponse.json(
      { error: 'Error al obtener la pauta técnica' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Update plan basic info
      await tx.taskPlan.update({
        where: { id: params.id },
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
        },
      })

      // Replace steps
      await tx.taskStep.deleteMany({
        where: { planId: params.id },
      })
      if (steps && Array.isArray(steps)) {
        await tx.taskStep.createMany({
          data: steps.map((step: any, idx: number) => ({
            planId: params.id,
            stepNumber: step.stepNumber || idx + 1,
            description: step.description,
            referenceVal: step.referenceVal || null,
            isMandatory: step.isMandatory ?? true,
          })),
        })
      }

      // Replace materials
      await tx.planMaterial.deleteMany({
        where: { planId: params.id },
      })
      if (materials && Array.isArray(materials)) {
        await tx.planMaterial.createMany({
          data: materials.map((mat: any) => ({
            planId: params.id,
            partId: mat.partId || null,
            materialName: mat.materialName,
            quantity: parseFloat(mat.quantity) || 1,
            unit: mat.unit || 'unidad',
          })),
        })
      }

      return tx.taskPlan.findUnique({
        where: { id: params.id },
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
          materials: { include: { part: true } },
        },
      })
    })

    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error('Error updating task plan:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la pauta técnica' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.taskPlan.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Pauta técnica eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting task plan:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la pauta técnica' },
      { status: 500 }
    )
  }
}
