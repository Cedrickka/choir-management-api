import { ActivityType, OrganizationType, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const permissionCodes = [
  'organization.read',
  'choirs.read',
  'choirs.update',
  'members.read',
  'members.create',
  'members.update',
  'members.archive',
  'voice-sections.manage',
  'roles.read',
  'roles.manage',
  'roles.assign',
  'attendance.scan',
  'attendance.correct',
  'finance.read',
  'finance.manage',
  'music.read',
  'music.manage',
  'announcements.manage',
  'calendar.read',
  'calendar.create',
  'calendar.update',
];
const rolePermissions: Record<string, string[]> = {
  ADMIN: permissionCodes,
  PRESIDENT: [
    'organization.read',
    'choirs.read',
    'members.read',
    'members.create',
    'members.update',
    'roles.read',
    'attendance.correct',
    'finance.read',
    'music.read',
    'announcements.manage',
    'calendar.read',
    'calendar.create',
    'calendar.update',
  ],
  SECRETARY: [
    'organization.read',
    'choirs.read',
    'members.read',
    'members.create',
    'members.update',
    'roles.read',
    'attendance.correct',
    'announcements.manage',
    'calendar.read',
    'calendar.create',
    'calendar.update',
  ],
  MAESTRO: [
    'choirs.read',
    'members.read',
    'roles.read',
    'music.read',
    'music.manage',
    'calendar.read',
    'calendar.create',
    'calendar.update',
  ],
  TREASURER: ['choirs.read', 'members.read', 'finance.read', 'finance.manage'],
  ATTENDANCE_CONTROLLER: [
    'choirs.read',
    'members.read',
    'attendance.scan',
    'attendance.correct',
  ],
  SECTION_LEADER: ['choirs.read', 'members.read', 'music.read'],
  MEMBER: ['choirs.read', 'members.read', 'music.read', 'calendar.read'],
};
async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'CSJB Organization',
      type: OrganizationType.CHOIR,
    },
  });
  const choir = await prisma.choir.upsert({
    where: { slug: 'choeur-saint-jean-bosco' },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Chœur Saint Jean Bosco',
      slug: 'choeur-saint-jean-bosco',
      timezone: 'Africa/Kinshasa',
    },
  });
  for (const [order, name] of ['Soprano', 'Alto', 'Ténor', 'Basse'].entries())
    await prisma.voiceSection.upsert({
      where: { choirId_name: { choirId: choir.id, name } },
      update: { order },
      create: { choirId: choir.id, name, order },
    });
  const pastoralYear = await prisma.pastoralYear.upsert({
    where: { choirId_name: { choirId: choir.id, name: '2026-2027' } },
    update: { isActive: true },
    create: {
      choirId: choir.id,
      name: '2026-2027',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-07-31'),
      isActive: true,
    },
  });
  await prisma.activity.upsert({
    where: { id: '22222222-2222-4222-8222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-4222-8222-222222222222',
      choirId: choir.id,
      pastoralYearId: pastoralYear.id,
      type: ActivityType.REHEARSAL,
      title: 'Répétition générale',
      startsAt: new Date('2026-08-18T17:00:00Z'),
      endsAt: new Date('2026-08-18T19:00:00Z'),
      timezone: 'Africa/Kinshasa',
      location: 'Paroisse Saint Jean Bosco',
    },
  });
  for (const code of permissionCodes)
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  const allPermissions = await prisma.permission.findMany();
  const roleRows: Record<string, { id: string }> = {};
  for (const [code, codes] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { name: code },
      create: {
        organizationId: organization.id,
        code,
        name: code,
        isSystem: true,
      },
    });
    roleRows[code] = role;
    for (const permission of allPermissions.filter((p) =>
      codes.includes(p.code),
    ))
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
  }
  const demos = [
    ['admin@csjb.local', 'Administrateur', 'CSJB', 'ADMIN'],
    ['maestro@csjb.local', 'Maestro', 'CSJB', 'MAESTRO'],
    ['tresorier@csjb.local', 'Trésorier', 'CSJB', 'TREASURER'],
    ['secretaire@csjb.local', 'Secrétaire', 'CSJB', 'SECRETARY'],
    ['membre1@csjb.local', 'Jean', 'Membre', 'MEMBER'],
    ['membre2@csjb.local', 'Marie', 'Membre', 'MEMBER'],
  ];
  const passwordHash = await bcrypt.hash('Demo-CSJB-2026!', 12);
  for (const [email, firstName, lastName, roleCode] of demos) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { firstName, lastName },
      create: { email, firstName, lastName, passwordHash },
    });
    const membership = await prisma.membership.upsert({
      where: { userId_choirId: { userId: user.id, choirId: choir.id } },
      update: { archivedAt: null, status: 'ACTIVE' },
      create: {
        userId: user.id,
        choirId: choir.id,
        profile: { create: { joinedChoirAt: new Date() } },
      },
    });
    await prisma.membershipRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId: membership.id,
          roleId: roleRows[roleCode].id,
        },
      },
      update: {},
      create: { membershipId: membership.id, roleId: roleRows[roleCode].id },
    });
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
