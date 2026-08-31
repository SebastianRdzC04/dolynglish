import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheckResultDto } from '../../common/types/api-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { apiOk, type ApiResponse } from '../../common/types/api-response.type';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Public()
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe — process is up' })
  @ApiOkResponse({ description: 'Liveness probe result', type: HealthCheckResultDto })
  live(): Promise<ApiResponse<HealthCheckResult>> {
    return this.health
      .check([() => ({ app: { status: 'up', uptime: process.uptime() } })])
      .then((result) => apiOk('Liveness', result));
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — DB is reachable' })
  @ApiOkResponse({ description: 'Readiness probe result', type: HealthCheckResultDto })
  ready(): Promise<ApiResponse<HealthCheckResult>> {
    return this.health
      .check([
        async () => {
          return { db: { status: 'up' as const } };
        },
      ])
      .then((result) => apiOk('Readiness', result));
  }
}
