import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Comptes de démonstration (changer les mots de passe en production)
const users = [
  { email: 'admin@cloudops.io', password: 'Admin123!', firstName: 'Ada', lastName: 'Admin', role: Role.ADMIN },
  { email: 'devops@cloudops.io', password: 'Devops123!', firstName: 'Dev', lastName: 'Ops', role: Role.DEVOPS },
  { email: 'viewer@cloudops.io', password: 'Viewer123!', firstName: 'Vic', lastName: 'Viewer', role: Role.VIEWER },
];

async function main() {
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        passwordHash: await bcrypt.hash(u.password, 10),
      },
    });
  }
  await seedDemoData();
  console.log('Seed terminé : admin / devops / viewer + données de démonstration.');
}

/** Données de démo pour que le dashboard ne soit pas vide (idempotent). */
async function seedDemoData() {
  if ((await prisma.project.count()) > 0) return;

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@cloudops.io' } });
  const devops = await prisma.user.findUniqueOrThrow({ where: { email: 'devops@cloudops.io' } });

  const project = await prisma.project.create({
    data: {
      name: 'Plateforme E-commerce',
      description: 'Boutique en ligne et services associés',
      members: { create: [{ userId: admin.id, role: 'OWNER' }, { userId: devops.id }] },
      environments: {
        create: [
          { name: 'Développement', type: 'DEV' },
          { name: 'Recette', type: 'STAGING' },
          { name: 'Production', type: 'PROD', url: 'https://shop.example.com' },
        ],
      },
    },
    include: { environments: true },
  });
  const env = (type: string) => project.environments.find((e) => e.type === type)!.id;

  const web = await prisma.server.create({
    data: { projectId: project.id, name: 'web-prod-01', provider: 'OVH', region: 'gra', cpuCores: 4, ramGb: 8, storageGb: 160, ipAddress: '51.38.10.11' },
  });
  const api = await prisma.server.create({
    data: { projectId: project.id, name: 'api-prod-01', provider: 'Hetzner', region: 'fsn1', cpuCores: 8, ramGb: 16, storageGb: 320, ipAddress: '88.99.20.21' },
  });
  await prisma.server.create({
    data: { projectId: project.id, name: 'staging-01', provider: 'AWS', region: 'eu-west-3', cpuCores: 2, ramGb: 4, storageGb: 80, ipAddress: '10.0.1.5', status: 'MAINTENANCE' },
  });
  await prisma.server.create({
    data: { projectId: project.id, name: 'backup-01', provider: 'DigitalOcean', region: 'fra1', cpuCores: 2, ramGb: 4, storageGb: 500, ipAddress: '165.22.30.31', status: 'OFFLINE' },
  });

  await prisma.application.createMany({
    data: [
      { projectId: project.id, serverId: web.id, environmentId: env('PROD'), name: 'storefront', version: '2.4.1' },
      { projectId: project.id, serverId: api.id, environmentId: env('PROD'), name: 'orders-api', version: '1.9.0' },
      { projectId: project.id, serverId: api.id, environmentId: env('STAGING'), name: 'orders-api', version: '2.0.0-rc1', status: 'DEPLOYING' },
    ],
  });

  // Règles globales (serverId = null)
  await prisma.alertRule.createMany({
    data: [
      { name: 'CPU critique', metric: 'CPU', operator: 'GT', threshold: 85, severity: 'CRITICAL' },
      { name: 'RAM élevée', metric: 'RAM', operator: 'GT', threshold: 80, severity: 'WARNING' },
      { name: 'Disque presque plein', metric: 'DISK', operator: 'GT', threshold: 90, severity: 'WARNING' },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
