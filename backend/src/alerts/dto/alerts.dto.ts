import { PartialType } from '@nestjs/swagger';
import { AlertStatus, MetricType, Operator, Severity } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateAlertRuleDto {
  /** Laisser vide pour une règle globale (tous les serveurs) */
  @IsOptional()
  @IsUUID()
  serverId?: string;

  @IsString()
  name: string;

  @IsEnum(MetricType)
  metric: MetricType;

  @IsOptional()
  @IsEnum(Operator)
  operator?: Operator;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  threshold: number;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateAlertRuleDto extends PartialType(CreateAlertRuleDto) {}

export class AlertQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsUUID()
  serverId?: string;
}
