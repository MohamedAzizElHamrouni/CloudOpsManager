import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApplicationsService } from './applications.service';
import { ApplicationQueryDto, CreateApplicationDto, UpdateApplicationDto } from './dto/applications.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private apps: ApplicationsService) {}

  @Get()
  findAll(@Query() q: ApplicationQueryDto) {
    return this.apps.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.apps.findOne(id);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.apps.create(dto);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApplicationDto) {
    return this.apps.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.apps.remove(id);
  }
}
