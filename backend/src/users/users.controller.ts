import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateProfileDto, UpdateRoleDto, UpdateUserDto, UserQueryDto } from './dto/users.dto';
import { UsersService } from './users.service';

const ALL = [Role.ADMIN, Role.DEVOPS, Role.VIEWER];

@ApiTags('Users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // Les routes "me" doivent être déclarées avant ":id"
  @Roles(...ALL)
  @Get('me')
  me(@Request() req) {
    return this.users.findOne(req.user.id);
  }

  @Roles(...ALL)
  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.users.update(req.user.id, dto);
  }

  @Get()
  findAll(@Query() q: UserQueryDto) {
    return this.users.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Patch(':id/role')
  setRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto, @Request() req) {
    return this.users.setRole(id, dto.role, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.users.remove(id, req.user.id);
  }
}
