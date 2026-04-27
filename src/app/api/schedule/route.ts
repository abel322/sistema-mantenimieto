import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { assetId, frequencyDays, frequencyType, nextDueDate, taskTemplate } =
      body

    const schedule = await prisma.schedule.create({
      data: {
        assetId,
        frequencyDays,
        frequencyType,
        nextDueDate: new Date(nextDueDate),
        taskTemplate,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Error al crear la programación' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { isActive: true },
      include: {
        asset: true,
      },
      orderBy: { nextDueDate: 'asc' },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Error al obtener las programaciones' },
      { status: 500 }
    )
  }
}
