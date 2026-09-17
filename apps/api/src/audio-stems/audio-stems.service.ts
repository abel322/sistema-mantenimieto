import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AudioStemsService {
  constructor(private prisma: PrismaService) {}

  async findByLessonId(lessonId: string) {
    return this.prisma.audioStem.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPresignedAudioUrl(stemId: string) {
    const stem = await this.prisma.audioStem.findUnique({
      where: { id: stemId },
    });

    if (!stem) {
      throw new NotFoundException(`Audio stem with ID ${stemId} not found`);
    }

    // Return the secure URL or presigned token simulation
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    return {
      stemId: stem.id,
      label: stem.label,
      url: stem.fileUrl,
      waveformJson: stem.waveformJson,
      expiresAt,
    };
  }
}
