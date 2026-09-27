import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';
import { RudimentItem, RudimentStep } from '@/types/drum';

// Helper to convert subdivision string to numeric value for RudimentItem
function parseSubdivisionToNumber(sub: string | number | undefined): number {
  if (typeof sub === 'number') return sub;
  switch (sub) {
    case '1/8':
      return 2;
    case '1/16':
      return 4;
    case '1/32':
      return 8;
    case '3:2':
      return 3;
    case '6:4':
      return 6;
    case '5:4':
      return 5;
    default:
      return 4;
  }
}

// GET /api/rudiments - Retrieve saved custom rudiments
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    const records = await prisma.customRudiment.findMany({
      where: {
        OR: [
          { userId },
          { userId: 'student-demo' },
          { userId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const rudiments: RudimentItem[] = records.map((r) => {
      const rawHits = (r.hits as any)?.steps || (Array.isArray(r.hits) ? r.hits : []);
      const steps: RudimentStep[] = Array.isArray(rawHits) ? rawHits : [];

      return {
        id: r.id,
        name: r.name,
        category: (r.category || 'custom') as any,
        difficulty: (r.difficulty || 'Intermedio') as any,
        description: r.description || 'Rudimento personalizado creado en Sonora Academy.',
        subdivision: parseSubdivisionToNumber(r.subdivision),
        defaultBpm: 100,
        steps,
        sticking: r.sticking || steps.map((s) => s.sticking),
        kitVoicing: (r.kitVoicing as any) || undefined,
        tags: ['Personal', 'Custom', r.category],
        isCustom: true,
        userId: r.userId || undefined,
        createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
      };
    });

    return NextResponse.json({ rudiments, count: rudiments.length }, { status: 200 });
  } catch (error) {
    console.error('[API /api/rudiments GET Error]:', error);
    return NextResponse.json(
      {
        rudiments: [],
        count: 0,
        warning: 'Base de datos temporalmente no disponible, usando fallback local.',
        error: error instanceof Error ? error.message : 'Database error',
      },
      { status: 200 }
    );
  }
}

// POST /api/rudiments - Save a new custom rudiment
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    const body = await req.json();
    const {
      name,
      category = 'custom',
      difficulty = 'Intermedio',
      subdivision = '1/16',
      sticking = [],
      hits,
      steps,
      kitVoicing = null,
      description = '',
    } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del rudimento es obligatorio.' },
        { status: 400 }
      );
    }

    const rawSteps: RudimentStep[] = steps || hits || [];
    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return NextResponse.json(
        { error: 'Debe contener al menos 1 golpe o paso rítmico en "steps" / "hits".' },
        { status: 400 }
      );
    }

    const stickingArray: string[] =
      sticking && Array.isArray(sticking) && sticking.length > 0
        ? sticking
        : rawSteps.map((st) => st.sticking || 'R');

    const created = await prisma.customRudiment.create({
      data: {
        userId,
        name: name.trim(),
        category: category || 'custom',
        difficulty: difficulty || 'Intermedio',
        subdivision: typeof subdivision === 'number' ? `1/${subdivision * 4}` : String(subdivision),
        sticking: stickingArray,
        hits: rawSteps as any,
        kitVoicing: kitVoicing as any,
        description: description ? String(description).trim() : null,
        isCustom: true,
      },
    });

    const item: RudimentItem = {
      id: created.id,
      name: created.name,
      category: (created.category || 'custom') as any,
      difficulty: (created.difficulty || 'Intermedio') as any,
      description: created.description || 'Rudimento personalizado creado en Sonora Academy.',
      subdivision: parseSubdivisionToNumber(created.subdivision),
      defaultBpm: 100,
      steps: rawSteps,
      sticking: created.sticking,
      kitVoicing: (created.kitVoicing as any) || undefined,
      tags: ['Personal', 'Custom', created.category],
      isCustom: true,
      userId: created.userId || undefined,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Rudimento guardado exitosamente en la base de datos.',
        rudiment: item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/rudiments POST Error]:', error);
    return NextResponse.json(
      {
        error: 'No se pudo guardar el rudimento en la base de datos.',
        details: error instanceof Error ? error.message : 'Database error',
      },
      { status: 500 }
    );
  }
}
