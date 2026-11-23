import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ServerQueryDto } from './dto/servers.dto';
import { ServersService } from './servers.service';

describe('ServersService', () => {
  let service: ServersService;
  const prisma = {
    $transaction: jest.fn(),
    server: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [ServersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ServersService);
  });

  it('retourne une liste paginée avec ses métadonnées', async () => {
    prisma.$transaction.mockResolvedValue([[{ id: '1' }, { id: '2' }], 25]);
    const q = Object.assign(new ServerQueryDto(), { page: 2, limit: 10 });
    const res = await service.findAll(q);
    expect(res.data).toHaveLength(2);
    expect(res.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it('applique les filtres et la recherche dans la requête Prisma', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);
    const q = Object.assign(new ServerQueryDto(), { page: 1, limit: 10, status: 'ONLINE', search: 'web' });
    await service.findAll(q);
    expect(prisma.server.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        where: expect.objectContaining({ status: 'ONLINE', OR: expect.any(Array) }),
      }),
    );
  });

  it("lève NotFoundException si le serveur n'existe pas", async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.findOne('inconnu')).rejects.toThrow(NotFoundException);
  });
});
