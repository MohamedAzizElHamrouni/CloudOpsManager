import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddMemberDto,
  CreateEnvironmentDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: ProjectQueryDto) {
    const where: Prisma.ProjectWhereInput = {
      status: q.status,
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { members: true, servers: true, applications: true } } },
      }),
      this.prisma.project.count({ where }),
    ]);
    return paginate(data, total, q);
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        environments: { orderBy: { createdAt: 'asc' } },
        members: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
        },
        _count: { select: { servers: true, applications: true } },
      },
    });
    if (!project) throw new NotFoundException('Projet introuvable');
    return project;
  }

  create(dto: CreateProjectDto, userId: string) {
    // Le créateur devient automatiquement OWNER du projet
    return this.prisma.project.create({
      data: { ...dto, members: { create: { userId, role: 'OWNER' } } },
    });
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true };
  }

  // ───── Membres / affectations ─────
  async addMember(projectId: string, dto: AddMemberDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      update: { role: dto.role ?? 'MEMBER' },
      create: { projectId, userId: user.id, role: dto.role ?? 'MEMBER' },
    });
  }

  async removeMember(projectId: string, userId: string) {
    const res = await this.prisma.projectMember.deleteMany({ where: { projectId, userId } });
    if (res.count === 0) throw new NotFoundException('Membre introuvable');
    return { deleted: true };
  }

  // ───── Environnements ─────
  listEnvironments(projectId: string) {
    return this.prisma.environment.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
  }

  addEnvironment(projectId: string, dto: CreateEnvironmentDto) {
    return this.prisma.environment.create({ data: { ...dto, projectId } });
  }

  async removeEnvironment(projectId: string, envId: string) {
    const res = await this.prisma.environment.deleteMany({ where: { id: envId, projectId } });
    if (res.count === 0) throw new NotFoundException('Environnement introuvable');
    return { deleted: true };
  }
}
