import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const guidelines = await prisma.technicalGuideline.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json(guidelines, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching technical guidelines:', error)
    return NextResponse.json(
      { error: 'Error al obtener las pautas técnicas' },
      { status: 500 }
    )
  }
}
