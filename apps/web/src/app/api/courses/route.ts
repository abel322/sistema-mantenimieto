import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role, TrackCategory, CourseLevel } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as TrackCategory | null;
    const level = searchParams.get('level') as CourseLevel | null;
    const search = searchParams.get('search');

    const where: any = {
      published: true,
    };

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
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
              select: {
                id: true,
                title: true,
                slug: true,
                orderIndex: true,
                type: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error('Fetch courses error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== Role.INSTRUCTOR && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: only instructors or admins can create courses' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug,
      description,
      category,
      level,
      price,
      coverImageUrl,
      trailerVideoUrl,
      published,
    } = body;

    if (!title || !slug || !description || !category) {
      return NextResponse.json(
        { error: 'Title, slug, description and category are required' },
        { status: 400 }
      );
    }

    const newCourse = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        category,
        level: level || CourseLevel.BEGINNER,
        price: price || 0,
        coverImageUrl,
        trailerVideoUrl,
        published: published ?? false,
        instructorId: user.id,
      },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error: any) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
