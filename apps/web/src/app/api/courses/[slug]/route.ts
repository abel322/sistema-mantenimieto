import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        modules: {
          include: {
            lessons: {
              include: {
                audioStems: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: `Course with slug "${slug}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Fetch course by slug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
