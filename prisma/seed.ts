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
  'attendance.read',
  'attendance.correct',
  'notifications.read',
  'notifications.manage',
  'reports.read',
  'reports.export',
  'liturgy.read',
  'liturgy.manage',
  'media.read',
  'media.manage',
  'finance.read',
  'finance.manage',
  'music.read',
  'music.manage',
  'announcements.read',
  'announcements.manage',
  'calendar.read',
  'calendar.create',
  'calendar.update',
  'justifications.create',
  'justifications.read',
  'justifications.manage',
  'rsvp.respond',
  'rsvp.read',
  'rsvp.manage',
  'subscriptions.read',
  'subscriptions.manage',
  'messaging.read',
  'messaging.manage',
  'payments.read',
  'payments.manage',
  'offline.manage',
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
    'attendance.read',
    'notifications.read',
    'notifications.manage',
    'reports.read',
    'reports.export',
    'liturgy.read',
    'liturgy.manage',
    'media.read',
    'media.manage',
    'finance.read',
    'music.read',
    'announcements.read',
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
    'attendance.read',
    'notifications.read',
    'notifications.manage',
    'reports.read',
    'reports.export',
    'liturgy.read',
    'liturgy.manage',
    'media.read',
    'media.manage',
    'announcements.read',
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
    'liturgy.read',
    'liturgy.manage',
    'media.read',
    'media.manage',
    'announcements.read',
    'calendar.read',
    'calendar.create',
    'calendar.update',
  ],
  TREASURER: [
    'choirs.read',
    'members.read',
    'finance.read',
    'finance.manage',
    'announcements.read',
  ],
  ATTENDANCE_CONTROLLER: [
    'choirs.read',
    'members.read',
    'attendance.scan',
    'attendance.read',
    'attendance.correct',
    'notifications.read',
    'announcements.read',
  ],
  SECTION_LEADER: [
    'choirs.read',
    'members.read',
    'music.read',
    'announcements.read',
    'liturgy.read',
    'media.read',
  ],
  MEMBER: [
    'choirs.read',
    'members.read',
    'music.read',
    'calendar.read',
    'notifications.read',
    'announcements.read',
    'liturgy.read',
    'media.read',
  ],
};
const grant = (roleCode: string, codes: string[]) => {
  rolePermissions[roleCode] = [
    ...new Set([...(rolePermissions[roleCode] || []), ...codes]),
  ];
};
grant('PRESIDENT', [
  'justifications.create',
  'justifications.read',
  'justifications.manage',
  'rsvp.respond',
  'rsvp.read',
  'rsvp.manage',
  'subscriptions.read',
  'subscriptions.manage',
  'messaging.read',
  'messaging.manage',
  'payments.read',
  'offline.manage',
]);
grant('SECRETARY', [
  'justifications.create',
  'justifications.read',
  'justifications.manage',
  'rsvp.respond',
  'rsvp.read',
  'rsvp.manage',
  'subscriptions.read',
  'messaging.read',
  'messaging.manage',
  'offline.manage',
]);
grant('MAESTRO', [
  'justifications.create',
  'rsvp.respond',
  'rsvp.read',
  'rsvp.manage',
  'messaging.read',
  'messaging.manage',
]);
grant('TREASURER', [
  'subscriptions.read',
  'payments.read',
  'payments.manage',
  'messaging.read',
]);
grant('ATTENDANCE_CONTROLLER', [
  'justifications.create',
  'justifications.read',
  'justifications.manage',
  'rsvp.respond',
  'rsvp.read',
  'offline.manage',
]);
grant('SECTION_LEADER', ['justifications.create', 'rsvp.respond', 'rsvp.read']);
grant('MEMBER', ['justifications.create', 'rsvp.respond']);
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
  const planRows = {
    FREE: await prisma.subscriptionPlan.upsert({
      where: { code: 'FREE' },
      update: {
        name: 'Free',
        quotas: { members: 30, storageGb: 1, whatsappCredits: 0 },
      },
      create: {
        code: 'FREE',
        name: 'Free',
        description: 'Plan de démarrage pour une petite chorale.',
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'USD',
        quotas: { members: 30, storageGb: 1, whatsappCredits: 0 },
      },
    }),
    PRO: await prisma.subscriptionPlan.upsert({
      where: { code: 'PRO' },
      update: {
        name: 'Pro',
        quotas: { members: 150, storageGb: 10, whatsappCredits: 0 },
      },
      create: {
        code: 'PRO',
        name: 'Pro',
        description: 'Plan pour chorales structurées avec plusieurs responsables.',
        monthlyPrice: 15,
        yearlyPrice: 150,
        currency: 'USD',
        quotas: { members: 150, storageGb: 10, whatsappCredits: 0 },
      },
    }),
    PREMIUM: await prisma.subscriptionPlan.upsert({
      where: { code: 'PREMIUM' },
      update: {
        name: 'Premium',
        quotas: { members: 500, storageGb: 50, whatsappCredits: 0 },
      },
      create: {
        code: 'PREMIUM',
        name: 'Premium',
        description: 'Plan avancé pour paroisses ou organisations multi-chorales.',
        monthlyPrice: 49,
        yearlyPrice: 490,
        currency: 'USD',
        quotas: { members: 500, storageGb: 50, whatsappCredits: 0 },
      },
    }),
  };
  const currentSubscription = await prisma.organizationSubscription.findFirst({
    where: { organizationId: organization.id },
    orderBy: { createdAt: 'desc' },
  });
  if (currentSubscription) {
    await prisma.organizationSubscription.update({
      where: { id: currentSubscription.id },
      data: { planId: planRows.PRO.id, status: 'ACTIVE' },
    });
  } else {
    await prisma.organizationSubscription.create({
      data: {
        organizationId: organization.id,
        planId: planRows.PRO.id,
        status: 'ACTIVE',
        billingPeriod: 'MONTHLY',
      },
    });
  }
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
  const demoMemberships: Record<string, string> = {};
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
    demoMemberships[email] = membership.id;
  }
  await prisma.user.update({
    where: { email: 'membre1@csjb.local' },
    data: { phone: '+243810000001' },
  });
  await prisma.memberProfile.update({
    where: { membershipId: demoMemberships['membre1@csjb.local'] },
    data: {
      whatsappConsentAt: new Date(),
      whatsappConsentSource: 'seed',
    },
  });
  await prisma.justification.upsert({
    where: { id: '91919191-9191-4919-8919-919191919191' },
    update: {},
    create: {
      id: '91919191-9191-4919-8919-919191919191',
      choirId: choir.id,
      membershipId: demoMemberships['membre1@csjb.local'],
      activityId: '22222222-2222-4222-8222-222222222222',
      kind: 'ABSENCE',
      reason: 'WORK',
      comment: 'Exemple de justification soumise par un choriste.',
      status: 'PENDING',
    },
  });
  await prisma.dispensation.upsert({
    where: { id: '92929292-9292-4929-8929-929292929292' },
    update: {
      status: 'APPROVED',
      excludeFromStatistics: true,
    },
    create: {
      id: '92929292-9292-4929-8929-929292929292',
      choirId: choir.id,
      membershipId: demoMemberships['membre2@csjb.local'],
      startsAt: new Date('2026-09-01T00:00:00Z'),
      endsAt: new Date('2026-09-15T23:59:59Z'),
      reason: 'TRAVEL',
      comment: 'Exemple de dispense approuvée exclue des statistiques.',
      status: 'APPROVED',
      excludeFromStatistics: true,
      reviewedByMembershipId: demoMemberships['secretaire@csjb.local'],
      reviewedAt: new Date(),
    },
  });
  await prisma.messagingTemplate.upsert({
    where: {
      choirId_name_provider: {
        choirId: choir.id,
        name: 'Rappel WhatsApp répétition',
        provider: 'MOCK',
      },
    },
    update: {
      body: 'Bonjour {Prenom}, rappel : {Activite} aura lieu le {Date}.',
      variables: ['Prenom', 'Activite', 'Date'],
      active: true,
    },
    create: {
      choirId: choir.id,
      name: 'Rappel WhatsApp répétition',
      provider: 'MOCK',
      providerTemplateName: 'csjb_activity_reminder',
      language: 'fr',
      variables: ['Prenom', 'Activite', 'Date'],
      body: 'Bonjour {Prenom}, rappel : {Activite} aura lieu le {Date}.',
    },
  });
  await prisma.financeFund.upsert({
    where: {
      choirId_name_currency: {
        choirId: choir.id,
        name: 'Caisse ordinaire',
        currency: 'CDF',
      },
    },
    update: {},
    create: {
      id: '33333333-3333-4333-8333-333333333333',
      choirId: choir.id,
      name: 'Caisse ordinaire',
      type: 'ORDINARY',
      currency: 'CDF',
      initialBalance: 0,
    },
  });
  await prisma.financeFund.upsert({
    where: {
      choirId_name_currency: {
        choirId: choir.id,
        name: 'Assistance',
        currency: 'USD',
      },
    },
    update: {},
    create: {
      id: '44444444-4444-4444-8444-444444444444',
      choirId: choir.id,
      name: 'Assistance',
      type: 'ASSISTANCE',
      currency: 'USD',
      initialBalance: 0,
    },
  });
  const song = await prisma.song.upsert({
    where: { id: '55555555-5555-4555-8555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-4555-8555-555555555555',
      choirId: choir.id,
      title: 'Kyrie eleison',
      language: 'fr',
      category: 'Ordinaire de messe',
      liturgicalSeason: 'ORDINARY_TIME',
      tags: ['messe', 'kyrie'],
      status: 'ACTIVE',
      lyrics: 'Kyrie eleison\nChriste eleison\nKyrie eleison',
      createdByMembershipId: demoMemberships['maestro@csjb.local'],
    },
  });
  const soprano = await prisma.voiceSection.findFirst({
    where: { choirId: choir.id, name: 'Soprano' },
  });
  if (soprano) {
    await prisma.songVoiceSectionMastery.upsert({
      where: {
        songId_voiceSectionId: {
          songId: song.id,
          voiceSectionId: soprano.id,
        },
      },
      update: { status: 'IN_PROGRESS' },
      create: {
        choirId: choir.id,
        songId: song.id,
        voiceSectionId: soprano.id,
        status: 'IN_PROGRESS',
        updatedByMembershipId: demoMemberships['maestro@csjb.local'],
      },
    });
  }
  await prisma.songTrack.upsert({
    where: { id: '56565656-5656-4656-8656-565656565656' },
    update: {},
    create: {
      id: '56565656-5656-4656-8656-565656565656',
      choirId: choir.id,
      songId: song.id,
      voiceSectionId: soprano?.id,
      type: 'SOPRANO',
      title: 'Guide Soprano',
      visibility: 'VOICE_SECTION',
      storageKey: 'demo/audio/kyrie-soprano.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 1024,
      checksum: 'demo-checksum-kyrie-soprano',
      durationSeconds: 60,
    },
  });
  const mass = await prisma.activity.upsert({
    where: { id: '66666666-6666-4666-8666-666666666666' },
    update: {},
    create: {
      id: '66666666-6666-4666-8666-666666666666',
      choirId: choir.id,
      pastoralYearId: pastoralYear.id,
      type: ActivityType.MASS,
      title: 'Messe dominicale',
      startsAt: new Date('2026-09-06T08:00:00Z'),
      endsAt: new Date('2026-09-06T10:00:00Z'),
      timezone: 'Africa/Kinshasa',
      location: 'Paroisse Saint Jean Bosco',
    },
  });
  const rsvpRequest = await prisma.rsvpRequest.upsert({
    where: { activityId: mass.id },
    update: {
      message: 'Merci de confirmer votre disponibilité pour la messe.',
      deadlineAt: new Date('2026-09-05T18:00:00Z'),
    },
    create: {
      choirId: choir.id,
      activityId: mass.id,
      message: 'Merci de confirmer votre disponibilité pour la messe.',
      deadlineAt: new Date('2026-09-05T18:00:00Z'),
      minByVoiceSection: {},
      createdByMembershipId: demoMemberships['maestro@csjb.local'],
    },
  });
  await prisma.rsvpResponse.upsert({
    where: {
      requestId_membershipId: {
        requestId: rsvpRequest.id,
        membershipId: demoMemberships['membre1@csjb.local'],
      },
    },
    update: { answer: 'YES', respondedAt: new Date() },
    create: {
      requestId: rsvpRequest.id,
      choirId: choir.id,
      activityId: mass.id,
      membershipId: demoMemberships['membre1@csjb.local'],
      answer: 'YES',
    },
  });
  await prisma.massContent.upsert({
    where: { activityId: mass.id },
    update: {},
    create: {
      choirId: choir.id,
      activityId: mass.id,
      title: 'Messe dominicale',
      liturgicalDate: new Date('2026-09-06'),
      readingsReferences: {
        firstReading: 'Référence à compléter',
        gospel: 'Référence à compléter',
      },
      summary: 'Résumé liturgique à compléter par le comité.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdByMembershipId: demoMemberships['secretaire@csjb.local'],
    },
  });
  await prisma.massSongbook.upsert({
    where: { id: '88888888-8888-4888-8888-888888888888' },
    update: {},
    create: {
      id: '88888888-8888-4888-8888-888888888888',
      choirId: choir.id,
      activityId: mass.id,
      title: 'Carnet de chants - Messe dominicale',
      storageKey: 'demo/pdf/carnet-messe-dominicale.pdf',
      mimeType: 'application/pdf',
      version: 1,
      createdByMembershipId: demoMemberships['secretaire@csjb.local'],
    },
  });
  await prisma.announcement.upsert({
    where: { id: '77777777-7777-4777-8777-777777777777' },
    update: {},
    create: {
      id: '77777777-7777-4777-8777-777777777777',
      choirId: choir.id,
      title: 'Bienvenue sur Choir Management',
      body: 'Merci de vérifier votre profil, votre pupitre et le calendrier des répétitions.',
      priority: 'IMPORTANT',
      audienceType: 'ALL_MEMBERS',
      status: 'PUBLISHED',
      publishAt: new Date(),
      readRequired: true,
      createdByMembershipId: demoMemberships['secretaire@csjb.local'],
    },
  });
  await prisma.notificationTemplate.upsert({
    where: {
      choirId_name_channel: {
        choirId: choir.id,
        name: 'Rappel activité 24 h',
        channel: 'IN_APP',
      },
    },
    update: {},
    create: {
      choirId: choir.id,
      name: 'Rappel activité 24 h',
      trigger: 'ACTIVITY_REMINDER',
      channel: 'IN_APP',
      title: 'Rappel : {Activite}',
      body: '{Activite} est prévue le {Date} à {Heure}, {Lieu}.',
      rules: { offsetMinutes: 1440 },
    },
  });
  await prisma.notificationTemplate.upsert({
    where: {
      choirId_name_channel: {
        choirId: choir.id,
        name: 'Rappel retard 10 min',
        channel: 'PUSH',
      },
    },
    update: {},
    create: {
      choirId: choir.id,
      name: 'Rappel retard 10 min',
      trigger: 'LATE_ARRIVAL',
      channel: 'PUSH',
      title: 'Votre présence',
      body: 'Le pointage de {Activite} est ouvert.',
      rules: { minutesAfter: 10 },
    },
  });
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
