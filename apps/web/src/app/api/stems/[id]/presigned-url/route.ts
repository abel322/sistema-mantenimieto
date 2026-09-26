import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@sonora/database';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const stem = await prisma.audioStem.findUnique({
      where: { id },
    });

    if (!stem) {
      return NextResponse.json(
        { error: `Audio stem with ID "${id}" not found` },
        { status: 404 }
      );
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return NextResponse.json({
      stemId: stem.id,
      label: stem.label,
      url: stem.fileUrl,
      waveformJson: stem.waveformJson,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
