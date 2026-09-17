import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AudioStemsService } from './audio-stems.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stems')
export class AudioStemsController {
  constructor(private stemsService: AudioStemsService) {}

  @Get('lesson/:lessonId')
  async getByLesson(@Param('lessonId') lessonId: string) {
    return this.stemsService.findByLessonId(lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/presigned-url')
  async getPresignedUrl(@Param('id') id: string) {
    return this.stemsService.getPresignedAudioUrl(id);
  }
}
