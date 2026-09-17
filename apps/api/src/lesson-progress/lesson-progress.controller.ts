import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class LessonProgressController {
  constructor(private progressService: LessonProgressService) {}

  @Post('update')
  async updateProgress(@Request() req: any, @Body() dto: UpdateProgressDto) {
    return this.progressService.updateProgress(req.user.id, dto);
  }

  @Get('course/:courseId')
  async getCourseProgress(@Request() req: any, @Param('courseId') courseId: string) {
    return this.progressService.getCourseProgress(req.user.id, courseId);
  }
}
