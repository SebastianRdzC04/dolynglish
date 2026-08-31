import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/errors/api-error.dto';
import { UsersService } from './users.service';
import { StreakQueryDto } from './dto/streak-query.dto';
import { StreakResponseDto } from './dto/streak-response.dto';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('user')
@ApiBearerAuth('access-token')
@Controller('user')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('streak')
  @ApiOperation({ summary: 'Get the user’s recent streak history' })
  @ApiQuery({ name: 'days', type: StreakQueryDto, required: true })
  @ApiOkResponse({ type: StreakResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async getStreak(
    @CurrentUser() current: AuthUser,
    @Query() query: StreakQueryDto,
  ): Promise<StreakResponseDto> {
    const days = await this.users.activeStreakFor(current.id, query.days);
    return { days, count: days.length };
  }
}
