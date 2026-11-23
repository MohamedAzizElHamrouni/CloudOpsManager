import { PartialType } from '@nestjs/swagger';
import { ServerStatus } from '@prisma/client';
import { IsEnum, IsInt, IsIP, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateServerDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsString()
  name: string;

  @IsString()
  provider: string;

  @IsString()
  region: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cpuCores: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ramGb: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  storageGb: number;

  @IsIP()
  ipAddress: string;

  @IsOptional()
  @IsEnum(ServerStatus)
  status?: ServerStatus;
}

export class UpdateServerDto extends PartialType(CreateServerDto) {}

export class ServerQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(ServerStatus)
  status?: ServerStatus;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
