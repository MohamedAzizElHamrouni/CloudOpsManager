import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RecordMetricDto {
  @IsUUID()
  serverId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  cpuUsage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  ramUsage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  diskUsage: number;

  @IsOptional()
  @IsBoolean()
  isUp?: boolean;
}

export class MetricsQueryDto {
  /** Fenêtre d'historique en heures (défaut 24) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  hours: number = 24;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit: number = 200;
}
