import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';
import { GroovePattern, GrooveCategory } from '@/types/drum';

// GET /api/grooves - Retrieve saved custom grooves
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    // Fetch user's custom grooves or public ones
    const records = await prisma.customGroove.findMany({
      where: {
        OR: [
          { userId },
          { userId: 'student-demo' },
          { userId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const grooves: GroovePattern[] = records.map((g) => ({
      id: g.id,
      name: g.name,
      category: (g.genre || 'Mis Grooves') as GrooveCategory,
      subCategory: g.subCategory || 'Creado en Sonora',
      difficulty: (g.difficulty || 'Intermedio') as any,
      suggestedBpm: g.suggestedBpm || 120,
      timeSignature: (g.timeSignature || '4/4') as any,
      swingRatio: g.swingRatio || 0,
      measuresCount: (g.measuresCount || 1) as any,
      subdivision: (g.subdivision || '1/16') as any,
      description: g.description || 'Groove personalizado capturado en Sonora Drum Lab.',
      isCustom: true,
      userId: g.userId || undefined,
      createdAt: g.createdAt ? g.createdAt.toISOString() : undefined,
      measures: (g.scoreData as any)?.measures || g.scoreData || [],
    }));

    return NextResponse.json({ grooves, count: grooves.length }, { status: 200 });
  } catch (error) {
    console.error('[API /api/grooves GET Error]:', error);
    // Return empty array with error info so client falls back seamlessly to localStorage
    return NextResponse.json(
      {
        grooves: [],
        count: 0,
        warning: 'Base de datos temporalmente no disponible, usando fallback local.',
        error: error instanceof Error ? error.message : 'Database error',
      },
      { status: 200 }
    );
  }
}

// POST /api/grooves - Save a new custom groove
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    const body = await req.json();
    const {
      name,
      genre = 'Mis Grooves',
      subCategory = 'Personal',
      difficulty = 'Intermedio',
      suggestedBpm = 120,
      timeSignature = '4/4',
      swingRatio = 0,
      measuresCount = 1,
      subdivision = '1/16',
      description = '',
      measures,
      scoreData,
    } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del groove es obligatorio.' },
        { status: 400 }
      );
    }

    const rhythmicData = measures || scoreData;
    if (!rhythmicData) {
      return NextResponse.json(
        { error: 'Los datos rítmicos (measures / scoreData) son obligatorios.' },
        { status: 400 }
      );
    }

    const createdRecord = await prisma.customGroove.create({
      data: {
        userId,
        name: name.trim(),
        genre: genre || 'Mis Grooves',
        subCategory: subCategory || 'Personal',
        difficulty: difficulty || 'Intermedio',
        suggestedBpm: Math.round(Number(suggestedBpm)) || 120,
        timeSignature: String(timeSignature || '4/4'),
        swingRatio: Number(swingRatio) || 0,
        measuresCount: Math.max(1, Math.round(Number(measuresCount)) || 1),
        subdivision: String(subdivision || '1/16'),
        description: description ? String(description).trim() : null,
        scoreData: rhythmicData,
        isCustom: true,
      },
    });

    const groovePattern: GroovePattern = {
      id: createdRecord.id,
      name: createdRecord.name,
      category: (createdRecord.genre || 'Mis Grooves') as GrooveCategory,
      subCategory: createdRecord.subCategory || 'Personal',
      difficulty: createdRecord.difficulty as any,
      suggestedBpm: createdRecord.suggestedBpm,
      timeSignature: createdRecord.timeSignature as any,
      swingRatio: createdRecord.swingRatio,
      measuresCount: createdRecord.measuresCount as any,
      subdivision: createdRecord.subdivision as any,
      description: createdRecord.description || 'Groove personalizado creado en Sonora Drum Lab.',
      isCustom: true,
      userId: createdRecord.userId || undefined,
      createdAt: createdRecord.createdAt.toISOString(),
      measures: (createdRecord.scoreData as any)?.measures || createdRecord.scoreData || [],
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Groove guardado exitosamente en la base de datos.',
        groove: groovePattern,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/grooves POST Error]:', error);
    return NextResponse.json(
      {
        error: 'No se pudo guardar el groove en la base de datos.',
        details: error instanceof Error ? error.message : 'Database error',
      },
      { status: 500 }
    );
  }
}
