import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @ApiQuery({ name: 'projectId', required: false })
  @Get('summary')
  summary(@Query('projectId') projectId?: string) {
    return this.dashboard.summary(projectId || undefined);
  }

  @Get('alerts-by-severity')
  alertsBySeverity() {
    return this.dashboard.alertsBySeverity();
  }
}
