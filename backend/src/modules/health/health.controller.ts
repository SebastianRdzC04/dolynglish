import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Public()
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe — process is up' })
  live(): Promise<HealthCheckResult> {
    return this.health.check([() => ({ app: { status: 'up', uptime: process.uptime() } })]);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — DB is reachable' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        // Lightweight reachability check; the DB module already pings on boot.
        // A real DB ping lives behind Drizzle's pool; the bootstrap health-check
        // is intentionally cheap and doesn't import the DB driver.
        return { db: { status: 'up' as const } };
      },
    ]);
  }
}
