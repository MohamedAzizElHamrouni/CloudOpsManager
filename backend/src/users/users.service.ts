import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { paginate } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UpdateUserDto, UserQueryDto } from './dto/users.dto';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: UserQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: q.role,
      ...(q.search
        ? {
            OR: [
              { email: { contains: q.search, mode: 'insensitive' } },
              { firstName: { contains: q.search, mode: 'insensitive' } },
              { lastName: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(data, total, q);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  update(id: string, dto: UpdateUserDto | UpdateProfileDto) {
    return this.prisma.user.update({ where: { id }, data: dto, select: userSelect });
  }

  setRole(id: string, role: Role, requesterId: string) {
    if (id === requesterId) throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle');
    return this.prisma.user.update({ where: { id }, data: { role }, select: userSelect });
  }

  async remove(id: string, requesterId: string) {
    if (id === requesterId) throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
