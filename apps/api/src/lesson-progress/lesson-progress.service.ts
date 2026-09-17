import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class LessonProgressService {
  constructor(private prisma: PrismaService) {}

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: { module: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${dto.lessonId} not found`);
    }

    const courseId = lesson.module.courseId;

    // 1. Upsert LessonProgress
    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: dto.lessonId,
        },
      },
      update: {
        completed: dto.completed ?? undefined,
        lastWatchedSecond: dto.lastWatchedSecond ?? undefined,
        score: dto.score ?? undefined,
      },
      create: {
        userId,
        lessonId: dto.lessonId,
        completed: dto.completed ?? false,
        lastWatchedSecond: dto.lastWatchedSecond ?? 0,
        score: dto.score,
      },
    });

    // 2. Recalculate total course progress
    const totalLessons = await this.prisma.lesson.count({
      where: {
        module: { courseId },
      },
    });

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { module: { courseId } },
      },
    });

    const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const isCompleted = progressPercent >= 100;

    // 3. Upsert Enrollment progress
    await this.prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        progressPercent,
        completed: isCompleted,
      },
      create: {
        userId,
        courseId,
        progressPercent,
        completed: isCompleted,
      },
    });

    return {
      progress,
      courseProgress: {
        courseId,
        totalLessons,
        completedLessons,
        progressPercent,
        completed: isCompleted,
      },
    };
  }

  async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    const lessonRecords = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: { module: { courseId } },
      },
      include: {
        lesson: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return {
      enrollment,
      lessonRecords,
    };
  }
}
