import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = body.name?.trim() || ''
    const code = body.code?.trim() || ''
    const description = body.description?.trim() || null
    const stock = parseInt(String(body.stock)) || 0
    const minStock = parseInt(String(body.minStock)) || 0
    const price = parseFloat(String(body.price ?? body.unitPrice ?? 0)) || 0
    const unit = body.unit?.trim() || 'pieza'
    const location = body.location?.trim() || null
    const category = body.category?.trim() || null
    const preferredSupplierId = body.preferredSupplierId?.trim() || null
    const assetIds = Array.isArray(body.assetIds)
      ? body.assetIds.filter(Boolean)
      : []

    if (!name || !code) {
      return NextResponse.json(
        { error: 'El nombre y el código del repuesto son obligatorios.' },
        { status: 400 }
      )
    }

    const part = await prisma.part.create({
      data: {
        name,
        code,
        description,
        stock,
        minStock,
        price,
        unit,
        location,
        category,
        preferredSupplierId,
        assets:
          assetIds.length > 0
            ? { connect: assetIds.map((id: string) => ({ id })) }
            : undefined,
      },
      include: {
        preferredSupplier: true,
        assets: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json(part, { status: 201 })
  } catch (error: any) {
    console.error('Error creating part:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El Código SKU ya se encuentra registrado en el sistema.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Error al crear el repuesto' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = {}

    if (assetId && assetId !== 'ALL') {
      where.assets = {
        some: {
          id: assetId,
        },
      }
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (search && search.trim()) {
      const query = search.trim()
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const parts = await prisma.part.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        preferredSupplier: true,
        assets: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json(parts)
  } catch (error) {
    console.error('Error fetching parts:', error)
    return NextResponse.json(
      { error: 'Error al obtener los repuestos' },
      { status: 500 }
    )
  }
}
