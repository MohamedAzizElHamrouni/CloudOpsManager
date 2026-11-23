import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationQueryDto, CreateApplicationDto, UpdateApplicationDto } from './dto/applications.dto';

const include = {
  server: { select: { id: true, name: true, ipAddress: true } },
  environment: { select: { id: true, name: true, type: true } },
  project: { select: { id: true, name: true } },
} satisfies Prisma.ApplicationInclude;

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: ApplicationQueryDto) {
    const where: Prisma.ApplicationWhereInput = {
      projectId: q.projectId,
      serverId: q.serverId,
      environmentId: q.environmentId,
      status: q.status,
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { deployedAt: 'desc' },
      }),
      this.prisma.application.count({ where }),
    ]);
    return paginate(data, total, q);
  }

  async findOne(id: string) {
    const app = await this.prisma.application.findUnique({ where: { id }, include });
    if (!app) throw new NotFoundException('Application introuvable');
    return app;
  }

  async create(dto: CreateApplicationDto) {
    // L'environnement doit appartenir au projet de l'application
    const env = await this.prisma.environment.findUnique({ where: { id: dto.environmentId } });
    if (!env || env.projectId !== dto.projectId) {
      throw new BadRequestException("L'environnement n'appartient pas à ce projet");
    }
    return this.prisma.application.create({ data: dto, include });
  }

  update(id: string, dto: UpdateApplicationDto) {
    return this.prisma.application.update({ where: { id }, data: dto, include });
  }

  async remove(id: string) {
    await this.prisma.application.delete({ where: { id } });
    return { deleted: true };
  }
}
