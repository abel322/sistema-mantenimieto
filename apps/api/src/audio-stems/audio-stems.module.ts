import { Module } from '@nestjs/common';
import { AudioStemsService } from './audio-stems.service';
import { AudioStemsController } from './audio-stems.controller';

@Module({
  controllers: [AudioStemsController],
  providers: [AudioStemsService],
  exports: [AudioStemsService],
})
export class AudioStemsModule {}
