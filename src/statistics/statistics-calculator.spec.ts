import { StatisticsCalculator } from './statistics-calculator';

describe('StatisticsCalculator', () => {
  const identity = {
    membershipId: 'membership-1',
    userId: 'user-1',
    firstName: 'Jean',
    lastName: 'Membre',
    email: 'jean@example.com',
    phone: null,
    voiceSection: { id: 'section-1', name: 'Ténor' },
  };

  it('calculates individual attendance, punctuality and duration metrics', () => {
    const result = StatisticsCalculator.summarizeMember(
      identity,
      [
        { activityId: 'a1', membershipId: 'membership-1' },
        { activityId: 'a2', membershipId: 'membership-1' },
        { activityId: 'a3', membershipId: 'membership-1' },
      ],
      [
        {
          activityId: 'a1',
          membershipId: 'membership-1',
          arrivedAt: new Date('2026-08-01T17:00:00Z'),
          leftAt: new Date('2026-08-01T19:00:00Z'),
          status: 'PRESENT',
          participationStatus: 'COMPLETE',
          minutesLate: 0,
          durationMinutes: 120,
        },
        {
          activityId: 'a2',
          membershipId: 'membership-1',
          arrivedAt: new Date('2026-08-02T17:11:00Z'),
          leftAt: new Date('2026-08-02T18:30:00Z'),
          status: 'LATE',
          participationStatus: 'PARTIAL',
          minutesLate: 11,
          durationMinutes: 79,
        },
      ],
    );

    expect(result).toMatchObject({
      expectedActivities: 3,
      present: 2,
      absent: 1,
      onTime: 1,
      late: 1,
      severelyLate: 0,
      minutesLateTotal: 11,
      durationMinutesTotal: 199,
      completeParticipations: 1,
      partialParticipations: 1,
      attendanceRate: 0.6667,
      punctualityRate: 0.5,
    });
  });

  it('aggregates member statistics with explicit zero-safe ratios', () => {
    const first = StatisticsCalculator.summarizeMember(
      identity,
      [{ activityId: 'a1', membershipId: 'membership-1' }],
      [],
    );
    const second = StatisticsCalculator.summarizeMember(
      { ...identity, membershipId: 'membership-2', userId: 'user-2' },
      [{ activityId: 'a1', membershipId: 'membership-2' }],
      [
        {
          activityId: 'a1',
          membershipId: 'membership-2',
          arrivedAt: new Date('2026-08-01T17:30:00Z'),
          leftAt: null,
          status: 'SEVERELY_LATE',
          participationStatus: 'PENDING',
          minutesLate: 30,
          durationMinutes: null,
        },
      ],
    );

    expect(StatisticsCalculator.aggregate([first, second])).toMatchObject({
      expectedActivities: 2,
      present: 1,
      absent: 1,
      severelyLate: 1,
      averageMinutesLate: 30,
      attendanceRate: 0.5,
      punctualityRate: 0,
    });
  });
});
