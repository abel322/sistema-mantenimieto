import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TrackCategory, CourseLevel } from '@sonora/database';

export class QueryCoursesDto {
  @IsOptional()
  @IsEnum(TrackCategory)
  category?: TrackCategory;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @IsString()
  search?: string;
}
