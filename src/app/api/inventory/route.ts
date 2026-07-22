import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, stock, minStock, price, unit, category, preferredSupplierId } = body

    const part = await prisma.part.create({
      data: {
        name,
        code,
        stock,
        minStock,
        price,
        unit,
        category,
        preferredSupplierId: preferredSupplierId || null,
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

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      orderBy: { name: 'asc' },
      include: {
        preferredSupplier: true,
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
