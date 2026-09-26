import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lessonId, completed, lastWatchedSecond, score } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: `Lesson with ID "${lessonId}" not found` },
        { status: 404 }
      );
    }

    const courseId = lesson.module.courseId;

    // 1. Upsert LessonProgress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      update: {
        completed: completed !== undefined ? completed : undefined,
        lastWatchedSecond: lastWatchedSecond !== undefined ? lastWatchedSecond : undefined,
        score: score !== undefined ? score : undefined,
      },
      create: {
        userId: user.id,
        lessonId,
        completed: completed ?? false,
        lastWatchedSecond: lastWatchedSecond ?? 0,
        score,
      },
    });

    // 2. Recalculate total course progress
    const totalLessons = await prisma.lesson.count({
      where: {
        module: { courseId },
      },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: user.id,
        completed: true,
        lesson: { module: { courseId } },
      },
    });

    const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const isCompleted = progressPercent >= 100;

    // 3. Upsert Enrollment progress
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
      update: {
        progressPercent,
        completed: isCompleted,
      },
      create: {
        userId: user.id,
        courseId,
        progressPercent,
        completed: isCompleted,
      },
    });

    return NextResponse.json({
      progress,
      courseProgress: {
        courseId,
        totalLessons,
        completedLessons,
        progressPercent,
        completed: isCompleted,
      },
    });
  } catch (error: any) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
