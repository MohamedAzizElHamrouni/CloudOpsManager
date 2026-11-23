import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';

describe('AlertsService.evaluate', () => {
  let service: AlertsService;
  const prisma = {
    alertRule: { findMany: jest.fn() },
    alert: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const rule = { id: 'r1', name: 'CPU élevé', metric: 'CPU', operator: 'GT', threshold: 80, severity: 'CRITICAL' };
  const reading = (cpu: number) => ({ cpuUsage: cpu, ramUsage: 10, diskUsage: 10 });

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.alertRule.findMany.mockResolvedValue([rule]);
    const module = await Test.createTestingModule({
      providers: [AlertsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AlertsService);
  });

  it('crée une alerte quand le seuil est dépassé', async () => {
    prisma.alert.findFirst.mockResolvedValue(null);
    await service.evaluate('s1', reading(92));
    expect(prisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ruleId: 'r1', serverId: 's1', severity: 'CRITICAL', value: 92 }) }),
    );
  });

  it("ne crée pas de doublon si une alerte est déjà ouverte", async () => {
    prisma.alert.findFirst.mockResolvedValue({ id: 'a1' });
    await service.evaluate('s1', reading(95));
    expect(prisma.alert.create).not.toHaveBeenCalled();
  });

  it('résout automatiquement l’alerte au retour à la normale', async () => {
    prisma.alert.findFirst.mockResolvedValue({ id: 'a1' });
    await service.evaluate('s1', reading(40));
    expect(prisma.alert.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' }, data: expect.objectContaining({ status: 'RESOLVED' }) }),
    );
  });

  it("ne fait rien si le seuil n'est pas dépassé et aucune alerte n'est ouverte", async () => {
    prisma.alert.findFirst.mockResolvedValue(null);
    await service.evaluate('s1', reading(10));
    expect(prisma.alert.create).not.toHaveBeenCalled();
    expect(prisma.alert.update).not.toHaveBeenCalled();
  });
});
