import { OmitType, PartialType } from '@nestjs/swagger';
import { AppStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateApplicationDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  serverId: string;

  @IsUUID()
  environmentId: string;

  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsOptional()
  @IsEnum(AppStatus)
  status?: AppStatus;

  @IsOptional()
  @IsString()
  repoUrl?: string;
}

// Le projet d'une application ne change pas après création
export class UpdateApplicationDto extends PartialType(OmitType(CreateApplicationDto, ['projectId'] as const)) {}

export class ApplicationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  serverId?: string;

  @IsOptional()
  @IsUUID()
  environmentId?: string;

  @IsOptional()
  @IsEnum(AppStatus)
  status?: AppStatus;
}
