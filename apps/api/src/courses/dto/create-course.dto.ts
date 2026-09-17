import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CourseLevel, TrackCategory } from '@sonora/database';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  slug!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  trailerVideoUrl?: string;

  @IsEnum(TrackCategory)
  category!: TrackCategory;

  @IsEnum(CourseLevel)
  level!: CourseLevel;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsNumber()
  price?: number;
}
