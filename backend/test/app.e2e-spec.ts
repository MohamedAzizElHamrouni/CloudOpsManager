import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Test d'intégration HTTP : toute la pile Nest (guards, pipes, filtre, controllers)
 * avec Prisma remplacé par un mock (aucune base de données requise).
 */
describe('API (intégration)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const users: Record<string, any> = {
    admin: { id: 'a', email: 'a@x.io', role: 'ADMIN', isActive: true },
    viewer: { id: 'v', email: 'v@x.io', role: 'VIEWER', isActive: true },
  };

  const prismaMock = {
    user: { findUnique: jest.fn(({ where }) => Object.values(users).find((u) => u.id === where.id) ?? null) },
    server: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), create: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([[], 0]),
  };

  const token = (u: any) => jwt.sign({ sub: u.id, email: u.email, role: u.role });

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    jwt = module.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 sans token', () => request(app.getHttpServer()).get('/servers').expect(401));

  it('200 pour un Viewer sur une lecture, avec pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/servers?page=1&limit=5')
      .set('Authorization', `Bearer ${token(users.viewer)}`)
      .expect(200);
    expect(res.body.meta).toEqual({ total: 0, page: 1, limit: 5, totalPages: 0 });
  });

  it('403 quand un Viewer tente de créer un serveur', () =>
    request(app.getHttpServer())
      .post('/servers')
      .set('Authorization', `Bearer ${token(users.viewer)}`)
      .send({ name: 'x' })
      .expect(403));

  it('400 si le DTO est invalide (Admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/servers')
      .set('Authorization', `Bearer ${token(users.admin)}`)
      .send({ name: 'web-1' })
      .expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.path).toBe('/servers');
  });

  it("400 à l'inscription avec un email invalide", () =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'pas-un-email', password: 'Password1!', firstName: 'A', lastName: 'B' })
      .expect(400));

  it('403 quand un Viewer accède à la liste des utilisateurs', () =>
    request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token(users.viewer)}`)
      .expect(403));
});
