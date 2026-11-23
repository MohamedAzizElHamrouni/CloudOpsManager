import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsQueryDto, RecordMetricDto } from './dto/monitoring.dto';

const clamp = (v: number) => Math.min(98, Math.max(3, v));
// Marche aléatoire : la nouvelle valeur reste proche de la précédente, avec des pics occasionnels
const drift = (prev: number, spikeChance = 0.04) =>
  clamp(prev + (Math.random() - 0.5) * 14 + (Math.random() < spikeChance ? 35 : 0));

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private prisma: PrismaService, private alerts: AlertsService) {}

  /** Mise à jour périodique : mesures simulées (collecte réelle remplaçable plus tard). */
  @Cron(CronExpression.EVERY_MINUTE)
  async collect() {
    const servers = await this.prisma.server.findMany({ where: { status: { not: 'MAINTENANCE' } } });
    for (const server of servers) {
      try {
        if (server.status === 'OFFLINE') {
          await this.prisma.metric.create({
            data: { serverId: server.id, cpuUsage: 0, ramUsage: 0, diskUsage: 0, isUp: false },
          });
          continue;
        }
        const last = await this.prisma.metric.findFirst({
          where: { serverId: server.id, isUp: true },
          orderBy: { recordedAt: 'desc' },
        });
        const reading = {
          cpuUsage: drift(last?.cpuUsage ?? 30),
          ramUsage: drift(last?.ramUsage ?? 45, 0.02),
          diskUsage: clamp((last?.diskUsage ?? 40) + Math.random() * 0.3), // le disque ne fait que croître
        };
        await this.prisma.metric.create({ data: { serverId: server.id, ...reading, isUp: true } });
        await this.alerts.evaluate(server.id, reading);
      } catch (e) {
        this.logger.error(`Collecte échouée pour ${server.name}`, e as Error);
      }
    }
  }

  /** Enregistrement manuel d'une mesure (agent externe ou test). */
  async record(dto: RecordMetricDto) {
    const server = await this.prisma.server.findUnique({ where: { id: dto.serverId } });
    if (!server) throw new NotFoundException('Serveur introuvable');
    const metric = await this.prisma.metric.create({ data: { ...dto, isUp: dto.isUp ?? true } });
    await this.alerts.evaluate(dto.serverId, dto);
    return metric;
  }

  async history(serverId: string, q: MetricsQueryDto) {
    await this.ensureServer(serverId);
    const since = new Date(Date.now() - q.hours * 3600_000);
    const rows = await this.prisma.metric.findMany({
      where: { serverId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'desc' },
      take: q.limit,
    });
    return rows.reverse(); // ordre chronologique pour les graphiques
  }

  async uptime(serverId: string, hours = 24) {
    await this.ensureServer(serverId);
    const since = new Date(Date.now() - hours * 3600_000);
    const [total, up] = await Promise.all([
      this.prisma.metric.count({ where: { serverId, recordedAt: { gte: since } } }),
      this.prisma.metric.count({ where: { serverId, recordedAt: { gte: since }, isUp: true } }),
    ]);
    return {
      serverId,
      hours,
      samples: total,
      uptimePercent: total === 0 ? null : Math.round((up / total) * 10000) / 100,
    };
  }

  private async ensureServer(id: string) {
    const exists = await this.prisma.server.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Serveur introuvable');
  }
}
