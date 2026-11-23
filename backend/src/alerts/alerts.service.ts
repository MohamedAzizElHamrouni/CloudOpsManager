import { Injectable, NotFoundException } from '@nestjs/common';
import { Operator, Prisma } from '@prisma/client';
import { paginate, PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AlertQueryDto, CreateAlertRuleDto, UpdateAlertRuleDto } from './dto/alerts.dto';

export interface Reading {
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
}

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  // ───── Règles (seuils configurables) ─────
  async listRules(q: PaginationQueryDto) {
    const where: Prisma.AlertRuleWhereInput = q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.alertRule.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { createdAt: 'desc' },
        include: { server: { select: { id: true, name: true } } },
      }),
      this.prisma.alertRule.count({ where }),
    ]);
    return paginate(data, total, q);
  }

  createRule(dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({ data: dto });
  }

  updateRule(id: string, dto: UpdateAlertRuleDto) {
    return this.prisma.alertRule.update({ where: { id }, data: dto });
  }

  async removeRule(id: string) {
    await this.prisma.alertRule.delete({ where: { id } });
    return { deleted: true };
  }

  // ───── Alertes / incidents ─────
  async listAlerts(q: AlertQueryDto) {
    const where: Prisma.AlertWhereInput = {
      status: q.status,
      severity: q.severity,
      serverId: q.serverId,
      ...(q.search ? { message: { contains: q.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { triggeredAt: 'desc' },
        include: {
          server: { select: { id: true, name: true } },
          rule: { select: { id: true, name: true, metric: true } },
        },
      }),
      this.prisma.alert.count({ where }),
    ]);
    return paginate(data, total, q);
  }

  async acknowledge(id: string, userId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerte introuvable');
    if (alert.status !== 'OPEN') return alert;
    return this.prisma.alert.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date(), acknowledgedById: userId },
    });
  }

  async resolve(id: string, userId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerte introuvable');
    if (alert.status === 'RESOLVED') return alert;
    return this.prisma.alert.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedById: userId },
    });
  }

  // ───── Évaluation des règles (appelée par le monitoring) ─────
  async evaluate(serverId: string, reading: Reading) {
    const rules = await this.prisma.alertRule.findMany({
      where: { enabled: true, OR: [{ serverId }, { serverId: null }] },
    });

    for (const rule of rules) {
      const value =
        rule.metric === 'CPU' ? reading.cpuUsage : rule.metric === 'RAM' ? reading.ramUsage : reading.diskUsage;
      const breached = this.compare(rule.operator, value, rule.threshold);
      const existing = await this.prisma.alert.findFirst({
        where: { ruleId: rule.id, serverId, status: { not: 'RESOLVED' } },
      });

      if (breached && !existing) {
        await this.prisma.alert.create({
          data: {
            ruleId: rule.id,
            serverId,
            severity: rule.severity,
            value,
            message: `${rule.name} : ${rule.metric} à ${value.toFixed(1)} % (seuil ${rule.threshold} %)`,
          },
        });
      } else if (!breached && existing) {
        // Retour à la normale : résolution automatique de l'incident
        await this.prisma.alert.update({
          where: { id: existing.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
      }
    }
  }

  private compare(op: Operator, value: number, threshold: number) {
    switch (op) {
      case 'GT':
        return value > threshold;
      case 'GTE':
        return value >= threshold;
      case 'LT':
        return value < threshold;
      case 'LTE':
        return value <= threshold;
    }
  }
}
