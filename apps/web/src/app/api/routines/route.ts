import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';
import { SavedRoutine, DrumMeasure } from '@/types/drum';
import { randomUUID } from 'crypto';

function parseTimeSignature(ts: string | [number, number] | undefined): string {
  if (Array.isArray(ts)) return `${ts[0]}/${ts[1]}`;
  if (typeof ts === 'string' && ts.includes('/')) return ts;
  return '4/4';
}

function timeSigToTuple(ts: string | [number, number] | undefined): [number, number] {
  if (Array.isArray(ts) && ts.length === 2) return [Number(ts[0]) || 4, Number(ts[1]) || 4];
  if (typeof ts === 'string' && ts.includes('/')) {
    const parts = ts.split('/');
    return [parseInt(parts[0], 10) || 4, parseInt(parts[1], 10) || 4];
  }
  return [4, 4];
}

// GET /api/routines - Retrieve user's saved routines
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    const records = await prisma.customRoutine.findMany({
      where: {
        OR: [
          { userId },
          { userId: 'student-demo' },
          { userId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const routines: SavedRoutine[] = records.map((r) => {
      const parsedScore = typeof r.scoreData === 'string' ? JSON.parse(r.scoreData) : r.scoreData;
      const measures: DrumMeasure[] =
        Array.isArray(parsedScore)
          ? parsedScore
          : Array.isArray(parsedScore?.measures)
          ? parsedScore.measures
          : [];

      const tsTuple = timeSigToTuple(r.timeSignature);

      return {
        id: r.id,
        userId: r.userId || undefined,
        title: r.title,
        bpm: r.bpm,
        timeSignature: tsTuple,
        totalMeasures: r.measuresCount,
        measuresCount: r.measuresCount,
        totalHits: r.totalHits,
        tags: r.tags || ['Groove'],
        scoreData: parsedScore,
        measures,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
      };
    });

    return NextResponse.json({ routines, count: routines.length }, { status: 200 });
  } catch (error) {
    console.error('[API /api/routines GET Error]:', error);
    return NextResponse.json(
      {
        routines: [],
        count: 0,
        warning: 'Base de datos temporalmente no disponible, usando fallback local.',
        error: error instanceof Error ? error.message : 'Database error',
      },
      { status: 200 }
    );
  }
}

// POST /api/routines - Save a new routine to the database
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    const body = await req.json();
    const {
      id,
      title,
      bpm = 120,
      timeSignature = '4/4',
      measuresCount,
      totalHits = 0,
      tags = ['Groove'],
      scoreData,
      measures,
    } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'El título de la rutina es obligatorio.' },
        { status: 400 }
      );
    }

    const rhythmicMeasures = measures || (scoreData && Array.isArray(scoreData.measures) ? scoreData.measures : scoreData);
    if (!rhythmicMeasures || !Array.isArray(rhythmicMeasures) || rhythmicMeasures.length === 0) {
      return NextResponse.json(
        { error: 'La estructura de compases (measures o scoreData) es obligatoria.' },
        { status: 400 }
      );
    }

    const calculatedHits =
      totalHits > 0
        ? totalHits
        : rhythmicMeasures.reduce((acc: number, m: any) => {
            return (
              acc +
              (m.beats || []).reduce((bAcc: number, b: any) => {
                return bAcc + (b.steps || []).reduce((sAcc: number, s: any) => sAcc + (s.hits?.length || 0), 0);
              }, 0)
            );
          }, 0);

    const calculatedMeasuresCount = measuresCount || rhythmicMeasures.length;
    const finalId = id && typeof id === 'string' && id.trim() ? id.trim() : randomUUID();
    const formattedTimeSig = parseTimeSignature(timeSignature);
    const cleanTags = Array.isArray(tags) && tags.length > 0 ? tags.map((t) => String(t).trim()).filter(Boolean) : ['Groove'];

    const newRecord = await prisma.customRoutine.create({
      data: {
        id: finalId,
        userId,
        title: title.trim(),
        bpm: Math.round(Number(bpm)) || 120,
        timeSignature: formattedTimeSig,
        measuresCount: Math.max(1, Math.round(Number(calculatedMeasuresCount)) || 1),
        totalHits: Math.max(0, Math.round(Number(calculatedHits)) || 0),
        tags: cleanTags,
        scoreData: {
          timeSignature: formattedTimeSig,
          bpm: Math.round(Number(bpm)) || 120,
          measures: rhythmicMeasures,
        },
      },
    });

    const parsedScore = typeof newRecord.scoreData === 'string' ? JSON.parse(newRecord.scoreData) : newRecord.scoreData;
    const finalMeasures: DrumMeasure[] =
      Array.isArray(parsedScore)
        ? parsedScore
        : Array.isArray(parsedScore?.measures)
        ? parsedScore.measures
        : rhythmicMeasures;

    const savedRoutine: SavedRoutine = {
      id: newRecord.id,
      userId: newRecord.userId || undefined,
      title: newRecord.title,
      bpm: newRecord.bpm,
      timeSignature: timeSigToTuple(newRecord.timeSignature),
      totalMeasures: newRecord.measuresCount,
      measuresCount: newRecord.measuresCount,
      totalHits: newRecord.totalHits,
      tags: newRecord.tags,
      scoreData: parsedScore,
      measures: finalMeasures,
      createdAt: newRecord.createdAt.toISOString(),
      updatedAt: newRecord.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Rutina guardada exitosamente en la base de datos.',
        routine: savedRoutine,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/routines POST Error]:', error);
    return NextResponse.json(
      {
        error: 'No se pudo guardar la rutina en la base de datos.',
        details: error instanceof Error ? error.message : 'Database error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/routines?id=... - Delete a routine by ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    // Also support reading id from body if not in query params
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // body may be empty
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de rutina no proporcionado.' },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    const existing = await prisma.customRoutine.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });
    }

    // Allow deleting if owned, public or demo
    if (existing.userId && existing.userId !== userId && existing.userId !== 'student-demo') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta rutina.' },
        { status: 403 }
      );
    }

    await prisma.customRoutine.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Rutina eliminada correctamente.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/routines DELETE Error]:', error);
    return NextResponse.json(
      {
        error: 'Error al eliminar la rutina de la base de datos.',
        details: error instanceof Error ? error.message : 'Database error',
      },
      { status: 500 }
    );
  }
}
