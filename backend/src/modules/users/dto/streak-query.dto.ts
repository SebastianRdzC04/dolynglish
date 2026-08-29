import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StreakQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days!: number;
}
