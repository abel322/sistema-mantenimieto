import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { LessonProgressModule } from './lesson-progress/lesson-progress.module';
import { AudioStemsModule } from './audio-stems/audio-stems.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CoursesModule,
    LessonProgressModule,
    AudioStemsModule,
  ],
})
export class AppModule {}
