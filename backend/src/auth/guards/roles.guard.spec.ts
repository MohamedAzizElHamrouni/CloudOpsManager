import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const ctx = (role?: string) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
    }) as unknown as ExecutionContext;

  it('autorise quand aucun rôle spécifique n’est requis', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(ctx('VIEWER'))).toBe(true);
  });

  it('autorise un rôle présent dans la liste', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN', 'DEVOPS']);
    expect(guard.canActivate(ctx('DEVOPS'))).toBe(true);
  });

  it('refuse un rôle insuffisant (403)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN', 'DEVOPS']);
    expect(() => guard.canActivate(ctx('VIEWER'))).toThrow(ForbiddenException);
  });
});
