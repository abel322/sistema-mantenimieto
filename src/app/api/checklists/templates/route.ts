import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const templates = await prisma.checklistTemplate.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        executions: {
          take: 5,
          orderBy: { completedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching checklist templates:', error)
    return NextResponse.json(
      { error: 'Error al obtener las plantillas de inspección' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, assetType, items } = body

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'El título y al menos un elemento son obligatorios' },
        { status: 400 }
      )
    }

    const template = await prisma.checklistTemplate.create({
      data: {
        title,
        description,
        assetType,
        items: {
          create: items.map((item: any) => ({
            label: item.label,
            type: item.type || 'BOOLEAN',
            isRequired: item.isRequired ?? true,
            defaultOption: item.defaultOption || null,
            minValue: item.minValue !== undefined && item.minValue !== '' ? parseFloat(item.minValue) : null,
            maxValue: item.maxValue !== undefined && item.maxValue !== '' ? parseFloat(item.maxValue) : null,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating checklist template:', error)
    return NextResponse.json(
      { error: 'Error al crear la plantilla de inspección' },
      { status: 500 }
    )
  }
}
