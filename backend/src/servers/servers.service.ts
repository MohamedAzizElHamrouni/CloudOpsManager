import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServerDto, ServerQueryDto, UpdateServerDto } from './dto/servers.dto';

@Injectable()
export class ServersService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: ServerQueryDto) {
    const where: Prisma.ServerWhereInput = {
      status: q.status,
      projectId: q.projectId,
      ...(q.provider ? { provider: { contains: q.provider, mode: 'insensitive' } } : {}),
      ...(q.region ? { region: { contains: q.region, mode: 'insensitive' } } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { ipAddress: { contains: q.search } },
              { provider: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.server.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true } } },
      }),
      this.prisma.server.count({ where }),
    ]);
    return paginate(data, total, q);
  }

  async findOne(id: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        applications: { include: { environment: { select: { name: true, type: true } } } },
        _count: { select: { alerts: true } },
      },
    });
    if (!server) throw new NotFoundException('Serveur introuvable');
    return server;
  }

  create(dto: CreateServerDto) {
    return this.prisma.server.create({ data: dto });
  }

  update(id: string, dto: UpdateServerDto) {
    return this.prisma.server.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.server.delete({ where: { id } });
    return { deleted: true };
  }
}
