import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/** Restreint une route à certains rôles : @Roles(Role.ADMIN, Role.DEVOPS) */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
/** Route accessible sans JWT (login, register) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
