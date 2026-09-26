import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId },
      },
    });

    const lessonRecords = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
        lesson: { module: { courseId } },
      },
      include: {
        lesson: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      enrollment,
      lessonRecords,
    });
  } catch (error: any) {
    console.error('Get course progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
