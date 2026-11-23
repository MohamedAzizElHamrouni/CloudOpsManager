import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { MetricsQueryDto, RecordMetricDto } from './dto/monitoring.dto';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@ApiBearerAuth()
@Controller('monitoring')
export class MonitoringController {
  constructor(private monitoring: MonitoringService) {}

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Post('metrics')
  record(@Body() dto: RecordMetricDto) {
    return this.monitoring.record(dto);
  }

  @Get('servers/:id/metrics')
  history(@Param('id', ParseUUIDPipe) id: string, @Query() q: MetricsQueryDto) {
    return this.monitoring.history(id, q);
  }

  @Get('servers/:id/uptime')
  uptime(@Param('id', ParseUUIDPipe) id: string, @Query() q: MetricsQueryDto) {
    return this.monitoring.uptime(id, q.hours);
  }
}
