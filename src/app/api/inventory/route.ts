import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, stock, minStock, price, unit, category, preferredSupplierId, assetIds } = body

    const part = await prisma.part.create({
      data: {
        name,
        code,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        price: Number(price) || 0,
        unit,
        category: category || null,
        preferredSupplierId: preferredSupplierId || null,
        assets: Array.isArray(assetIds) && assetIds.length > 0 ? {
          connect: assetIds.map((id: string) => ({ id })),
        } : undefined,
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
  } catch (error) {
    console.error('Error creating part:', error)
    return NextResponse.json(
      { error: 'Error al crear el repuesto' },
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
