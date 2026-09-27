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
      return NextResponse.json({ error: 'ID de rudimento no proporcionado.' }, { status: 400 });
    }

    const authUser = await getAuthUser(req).catch(() => null);
    const userId = authUser?.id || 'student-demo';

    const existing = await prisma.customRudiment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rudimento no encontrado.' }, { status: 404 });
    }

    if (existing.userId && existing.userId !== userId && existing.userId !== 'student-demo') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este rudimento.' },
        { status: 403 }
      );
    }

    await prisma.customRudiment.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Rudimento eliminado correctamente.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/rudiments/[id] DELETE Error]:', error);
    return NextResponse.json(
      {
        error: 'Error al eliminar el rudimento de la base de datos.',
        details: error instanceof Error ? error.message : 'Database error',
      },
      { status: 500 }
    );
  }
}
