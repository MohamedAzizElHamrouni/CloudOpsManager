import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
  const jwt = { sign: jest.fn().mockReturnValue('token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('refuse un email déjà utilisé', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1' });
    await expect(
      service.register({ email: 'a@a.io', password: 'Password1!', firstName: 'A', lastName: 'B' }),
    ).rejects.toThrow(ConflictException);
  });

  it('refuse un mauvais mot de passe', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: '1', email: 'a@a.io', role: 'VIEWER', isActive: true,
      passwordHash: await bcrypt.hash('autre', 4),
    });
    await expect(service.login({ email: 'a@a.io', password: 'Password1!' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('retourne un JWT si les identifiants sont valides', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: '1', email: 'a@a.io', role: 'ADMIN', isActive: true, firstName: 'A', lastName: 'B',
      passwordHash: await bcrypt.hash('Password1!', 4),
    });
    const res = await service.login({ email: 'a@a.io', password: 'Password1!' });
    expect(res.accessToken).toBe('token');
  });
});
