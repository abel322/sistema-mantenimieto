import { IsBoolean, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsNotEmpty()
  lessonId!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastWatchedSecond?: number;

  @IsOptional()
  @IsInt()
  score?: number;
}
