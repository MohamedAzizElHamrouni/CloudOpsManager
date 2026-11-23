import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  AddMemberDto,
  CreateEnvironmentDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/projects.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Get()
  findAll(@Query() q: ProjectQueryDto) {
    return this.projects.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.findOne(id);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.projects.create(dto, req.user.id);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.remove(id);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Post(':id/members')
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMemberDto) {
    return this.projects.addMember(id, dto);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Delete(':id/members/:userId')
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.projects.removeMember(id, userId);
  }

  @Get(':id/environments')
  listEnvironments(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.listEnvironments(id);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Post(':id/environments')
  addEnvironment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateEnvironmentDto) {
    return this.projects.addEnvironment(id, dto);
  }

  @Roles(Role.ADMIN, Role.DEVOPS)
  @Delete(':id/environments/:envId')
  removeEnvironment(@Param('id', ParseUUIDPipe) id: string, @Param('envId', ParseUUIDPipe) envId: string) {
    return this.projects.removeEnvironment(id, envId);
  }
}
