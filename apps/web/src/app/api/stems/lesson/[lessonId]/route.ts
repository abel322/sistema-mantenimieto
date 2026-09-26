import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    const stems = await prisma.audioStem.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(stems);
  } catch (error: any) {
    console.error('Fetch stems error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
