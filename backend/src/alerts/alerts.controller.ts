import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AlertsService } from './alerts.service';
import { AlertQueryDto, CreateAlertRuleDto, UpdateAlertRuleDto } from './dto/alerts.dto';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller()
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  // ───── Règles ─────
  @Get('alert-rules')
  listRules(@Query() q: PaginationQueryDto) {
    return this.alerts.listRules(q);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Post('alert-rules')
  createRule(@Body() dto: CreateAlertRuleDto) {
    return this.alerts.createRule(dto);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Patch('alert-rules/:id')
  updateRule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAlertRuleDto) {
    return this.alerts.updateRule(id, dto);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Delete('alert-rules/:id')
  removeRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.alerts.removeRule(id);
  }

  // ───── Alertes ─────
  @Get('alerts')
  listAlerts(@Query() q: AlertQueryDto) {
    return this.alerts.listAlerts(q);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Patch('alerts/:id/acknowledge')
  acknowledge(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.alerts.acknowledge(id, req.user.id);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Patch('alerts/:id/resolve')
  resolve(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.alerts.resolve(id, req.user.id);
  }
}
