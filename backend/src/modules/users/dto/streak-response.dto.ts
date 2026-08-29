import { IsArray, IsInt, Max, Min } from 'class-validator';

export class StreakResponseDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(1, { each: true })
  days!: number[];

  @IsInt()
  count!: number;
}
