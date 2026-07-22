import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, area, criticality, description } = body

    const asset = await prisma.asset.create({
      data: {
        name,
        code,
        area,
        criticality,
        description,
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Error al crear el activo' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(assets, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Error al obtener los activos' },
      { status: 500 }
    )
  }
}
