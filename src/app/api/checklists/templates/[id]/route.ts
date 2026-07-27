import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching checklist template:', error)
    return NextResponse.json(
      { error: 'Error al obtener la plantilla de inspección' },
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
    const { title, description, assetType, isActive, items } = body

    // Transaction to update template and replace items safely
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // Update template basic info
      await tx.checklistTemplate.update({
        where: { id: params.id },
        data: {
          title,
          description,
          assetType,
          ...(typeof isActive === 'boolean' ? { isActive } : {}),
        },
      })

      if (items && Array.isArray(items)) {
        // Delete items that are not in the payload
        const existingItemIds = items.filter((i: any) => i.id).map((i: any) => i.id)
        await tx.checklistItem.deleteMany({
          where: {
            templateId: params.id,
            id: { notIn: existingItemIds },
          },
        })

        // Upsert items
        for (const item of items) {
          const itemData = {
            label: item.label,
            type: item.type || 'BOOLEAN',
            isRequired: item.isRequired ?? true,
            defaultOption: item.defaultOption || null,
            minValue: item.minValue !== undefined && item.minValue !== null && item.minValue !== '' ? parseFloat(item.minValue) : null,
            maxValue: item.maxValue !== undefined && item.maxValue !== null && item.maxValue !== '' ? parseFloat(item.maxValue) : null,
          }

          if (item.id) {
            await tx.checklistItem.update({
              where: { id: item.id },
              data: itemData,
            })
          } else {
            await tx.checklistItem.create({
              data: {
                ...itemData,
                templateId: params.id,
              },
            })
          }
        }
      }

      return tx.checklistTemplate.findUnique({
        where: { id: params.id },
        include: { items: true },
      })
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating checklist template:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la plantilla de inspección' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the template has associated ChecklistExecution records
    const executionsCount = await prisma.checklistExecution.count({
      where: { templateId: params.id },
    })

    if (executionsCount > 0) {
      // Soft delete: deactivate template to preserve inspection history
      await prisma.checklistTemplate.update({
        where: { id: params.id },
        data: { isActive: false },
      })

      return NextResponse.json({
        softDeleted: true,
        message: 'Esta plantilla tiene inspecciones registradas en el historial. Se ha desactivado para ocultarla y conservar los registros.',
      })
    }

    try {
      await prisma.checklistTemplate.delete({
        where: { id: params.id },
      })

      return NextResponse.json({ message: 'Plantilla eliminada exitosamente' })
    } catch (deleteError: any) {
      // Catch Prisma foreign key constraint error (e.g. P2003)
      if (deleteError?.code === 'P2003' || deleteError?.message?.includes('Foreign key')) {
        await prisma.checklistTemplate.update({
          where: { id: params.id },
          data: { isActive: false },
        })

        return NextResponse.json({
          softDeleted: true,
          message: 'No se puede eliminar esta plantilla porque ya tiene inspecciones registradas en el historial. Puedes desactivarla para ocultarla.',
        })
      }

      throw deleteError
    }
  } catch (error) {
    console.error('Error deleting checklist template:', error)
    return NextResponse.json(
      { error: 'No se puede eliminar esta plantilla porque ya tiene inspecciones registradas en el historial. Puedes desactivarla para ocultarla.' },
      { status: 500 }
    )
  }
}
