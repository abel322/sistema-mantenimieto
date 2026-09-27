import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID de groove no proporcionado.' }, { status: 400 });
    }

    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    // Verify groove exists
    const existing = await prisma.customGroove.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Groove no encontrado.' }, { status: 404 });
    }

    // Allow deleting if owned or if in demo mode
    if (existing.userId && existing.userId !== userId && existing.userId !== 'student-demo') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este groove.' },
        { status: 403 }
      );
    }

    await prisma.customGroove.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Groove eliminado correctamente.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/grooves/[id] DELETE Error]:', error);
    return NextResponse.json(
      {
        error: 'Error al eliminar el groove de la base de datos.',
        details: error instanceof Error ? error.message : 'Database error',
      },
      { status: 500 }
    );
  }
}
