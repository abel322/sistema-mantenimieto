import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ToolStatus, ToolType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: any = {}

    if (status && status !== 'ALL') {
      where.status = status as ToolStatus
    }

    if (type && type !== 'ALL') {
      where.type = type as ToolType
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
      ]
    }

    const tools = await prisma.tool.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            code: true,
            area: true,
          },
        },
      },
    })

    return NextResponse.json(tools, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching tools:', error)
    return NextResponse.json(
      { error: 'Error al obtener la lista de herramientas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      code,
      name,
      category,
      type,
      status = 'AVAILABLE',
      brand,
      serialNumber,
      assetId,
      area,
      assignedTo,
      assignedAt,
      notes,
    } = body

    if (!code || !name || !category || !type) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (código, nombre, categoría, tipo)' },
        { status: 400 }
      )
    }

    // Check unique code
    const existing = await prisma.tool.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una herramienta con el código ${code}` },
        { status: 400 }
      )
    }

    const tool = await prisma.tool.create({
      data: {
        code,
        name,
        category,
        type,
        status: status as ToolStatus,
        brand: brand || null,
        serialNumber: serialNumber || null,
        assetId: assetId || null,
        area: area || null,
        assignedTo: assignedTo || null,
        assignedAt: assignedAt ? new Date(assignedAt) : null,
        notes: notes || null,
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            code: true,
            area: true,
          },
        },
      },
    })

    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    console.error('Error creating tool:', error)
    return NextResponse.json(
      { error: 'Error al crear la herramienta' },
      { status: 500 }
    )
  }
}
