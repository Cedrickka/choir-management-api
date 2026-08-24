import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

jest.setTimeout(30000);

describe('API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const choirA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const choirB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  beforeAll(async () => {
    const hash = await bcrypt.hash('Demo-CSJB-2026!', 4);
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'membre@csjb.local',
      phone: null,
      firstName: 'Jean',
      lastName: 'Membre',
      status: 'ACTIVE',
      passwordHash: hash,
    };
    const membership = {
      id: 'm',
      status: 'ACTIVE',
      archivedAt: null,
      choir: {
        status: 'ACTIVE',
        organizationId: 'o',
        organization: { status: 'ACTIVE' },
      },
      roles: [
        {
          role: {
            permissions: [
              { permission: { code: 'members.read' } },
              { permission: { code: 'calendar.read' } },
            ],
          },
        },
      ],
    };
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      refreshToken: { create: jest.fn() },
      membership: {
        findUnique: jest.fn(({ where }: any) =>
          Promise.resolve(
            where.userId_choirId.choirId === choirA ? membership : null,
          ),
        ),
        findMany: jest.fn().mockResolvedValue([]),
      },
      choir: {
        findUnique: jest.fn().mockResolvedValue({
          id: choirA,
          name: 'Chœur Saint Jean Bosco',
          slug: 'choeur-saint-jean-bosco',
          timezone: 'Africa/Kinshasa',
          status: 'ACTIVE',
        }),
      },
      activity: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });
  afterAll(() => app.close());
  it('GET /health', () =>
    request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((r) =>
        expect(r.body).toMatchObject({
          status: 'ok',
          service: 'choir-management-api',
        }),
      ));
  it('POST /auth/login', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'membre@csjb.local', password: 'Demo-CSJB-2026!' })
      .expect(201);
    token = r.body.accessToken;
    expect(token).toBeTruthy();
  });
  it('GET /me', () =>
    request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((r) => expect(r.body.email).toBe('membre@csjb.local')));
  it('GET /me/statistics', () =>
    request(app.getHttpServer())
      .get('/api/v1/me/statistics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((r) => expect(r.body.data).toEqual([])));
  it('isolates Choir B', () =>
    request(app.getHttpServer())
      .get(`/api/v1/choirs/${choirB}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403));
  it('denies MEMBER admin action', () =>
    request(app.getHttpServer())
      .get(`/api/v1/choirs/${choirA}/admin`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403));
  it('denies MEMBER creating a member', () =>
    request(app.getHttpServer())
      .post(`/api/v1/choirs/${choirA}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'X',
        lastName: 'Y',
        email: 'x@y.cd',
        temporaryPassword: 'Temporary-123',
      })
      .expect(403));
  it('denies MEMBER reading choir statistics', () =>
    request(app.getHttpServer())
      .get(`/api/v1/choirs/${choirA}/statistics`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403));
  it('allows MEMBER to read the calendar', () =>
    request(app.getHttpServer())
      .get(`/api/v1/choirs/${choirA}/activities`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200));
  it('denies MEMBER creating an activity', () =>
    request(app.getHttpServer())
      .post(`/api/v1/choirs/${choirA}/activities`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'REHEARSAL',
        title: 'Private activity',
        startsAt: '2026-09-01T18:00:00+01:00',
        endsAt: '2026-09-01T20:00:00+01:00',
      })
      .expect(403));
});
