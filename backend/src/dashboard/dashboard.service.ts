import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const toMap = <K extends string>(rows: { [k: string]: any }[], key: string) =>
  Object.fromEntries(rows.map((r) => [r[key] as K, r._count._all as number]));

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary(projectId?: string) {
    const serverWhere: Prisma.ServerWhereInput = projectId ? { projectId } : {};
    const since = new Date(Date.now() - 15 * 60_000);

    const [projects, servers, applications, serversByStatus, appsByStatus, openBySeverity, usage, recentAlerts] =
      await Promise.all([
        this.prisma.project.count({ where: projectId ? { id: projectId } : {} }),
        this.prisma.server.count({ where: serverWhere }),
        this.prisma.application.count({ where: projectId ? { projectId } : {} }),
        this.prisma.server.groupBy({ by: ['status'], where: serverWhere, _count: { _all: true } }),
        this.prisma.application.groupBy({
          by: ['status'],
          where: projectId ? { projectId } : {},
          _count: { _all: true },
        }),
        this.prisma.alert.groupBy({
          by: ['severity'],
          where: { status: { not: 'RESOLVED' }, server: serverWhere },
          _count: { _all: true },
        }),
        this.prisma.metric.aggregate({
          where: { server: serverWhere, recordedAt: { gte: since }, isUp: true },
          _avg: { cpuUsage: true, ramUsage: true, diskUsage: true },
        }),
        this.prisma.alert.findMany({
          where: { server: serverWhere },
          orderBy: { triggeredAt: 'desc' },
          take: 5,
          include: { server: { select: { id: true, name: true } } },
        }),
      ]);

    const openAlertsBySeverity = toMap(openBySeverity, 'severity');
    const round = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

    return {
      totals: {
        projects,
        servers,
        applications,
        openAlerts: Object.values(openAlertsBySeverity).reduce((a, b) => a + b, 0),
      },
      serversByStatus: toMap(serversByStatus, 'status'),
      applicationsByStatus: toMap(appsByStatus, 'status'),
      openAlertsBySeverity,
      averageUsage: {
        cpu: round(usage._avg.cpuUsage),
        ram: round(usage._avg.ramUsage),
        disk: round(usage._avg.diskUsage),
      },
      recentAlerts,
    };
  }

  /** Nombre d'alertes (tous statuts) par gravité sur les 7 derniers jours. */
  async alertsBySeverity() {
    const since = new Date(Date.now() - 7 * 24 * 3600_000);
    const rows = await this.prisma.alert.groupBy({
      by: ['severity'],
      where: { triggeredAt: { gte: since } },
      _count: { _all: true },
    });
    return rows.map((r) => ({ severity: r.severity, count: r._count._all }));
  }
}
