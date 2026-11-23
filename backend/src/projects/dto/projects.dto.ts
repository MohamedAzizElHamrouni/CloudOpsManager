import { PartialType } from '@nestjs/swagger';
import { EnvironmentType, ProjectMemberRole, ProjectStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class ProjectQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;
}

export class CreateEnvironmentDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(EnvironmentType)
  type: EnvironmentType;

  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;
}
