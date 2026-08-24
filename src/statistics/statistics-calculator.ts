export type AttendanceFact = {
  activityId: string;
  membershipId: string;
  arrivedAt: Date | null;
  leftAt: Date | null;
  status: 'PRESENT' | 'LATE' | 'SEVERELY_LATE' | 'ABSENT';
  participationStatus: 'PENDING' | 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  minutesLate: number;
  durationMinutes: number | null;
};

export type ExpectedAttendanceSlot = {
  activityId: string;
  membershipId: string;
};

export type StatisticsIdentity = {
  membershipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  voiceSection?: { id: string; name: string } | null;
};

export type MemberStatistics = StatisticsIdentity & {
  expectedActivities: number;
  present: number;
  absent: number;
  onTime: number;
  late: number;
  severelyLate: number;
  minutesLateTotal: number;
  averageMinutesLate: number;
  durationMinutesTotal: number;
  completeParticipations: number;
  partialParticipations: number;
  insufficientParticipations: number;
  pendingParticipations: number;
  attendanceRate: number;
  punctualityRate: number;
};

export type AggregateStatistics = {
  expectedActivities: number;
  present: number;
  absent: number;
  onTime: number;
  late: number;
  severelyLate: number;
  minutesLateTotal: number;
  averageMinutesLate: number;
  durationMinutesTotal: number;
  completeParticipations: number;
  partialParticipations: number;
  insufficientParticipations: number;
  pendingParticipations: number;
  attendanceRate: number;
  punctualityRate: number;
};

export class StatisticsCalculator {
  static summarizeMember(
    identity: StatisticsIdentity,
    expectedSlots: ExpectedAttendanceSlot[],
    attendanceFacts: AttendanceFact[],
  ): MemberStatistics {
    const expectedActivityIds = new Set(
      expectedSlots
        .filter((slot) => slot.membershipId === identity.membershipId)
        .map((slot) => slot.activityId),
    );
    const facts = attendanceFacts.filter(
      (fact) =>
        fact.membershipId === identity.membershipId &&
        expectedActivityIds.has(fact.activityId) &&
        fact.arrivedAt,
    );
    const expectedActivities = expectedActivityIds.size;
    const present = facts.length;
    const onTime = facts.filter((fact) => fact.status === 'PRESENT').length;
    const late = facts.filter((fact) => fact.status === 'LATE').length;
    const severelyLate = facts.filter(
      (fact) => fact.status === 'SEVERELY_LATE',
    ).length;
    const minutesLateTotal = facts.reduce(
      (sum, fact) => sum + fact.minutesLate,
      0,
    );
    const durationMinutesTotal = facts.reduce(
      (sum, fact) => sum + (fact.durationMinutes || 0),
      0,
    );
    const participation = (status: AttendanceFact['participationStatus']) =>
      facts.filter((fact) => fact.participationStatus === status).length;

    return {
      ...identity,
      expectedActivities,
      present,
      absent: Math.max(0, expectedActivities - present),
      onTime,
      late,
      severelyLate,
      minutesLateTotal,
      averageMinutesLate: this.ratio(minutesLateTotal, present),
      durationMinutesTotal,
      completeParticipations: participation('COMPLETE'),
      partialParticipations: participation('PARTIAL'),
      insufficientParticipations: participation('INSUFFICIENT'),
      pendingParticipations: participation('PENDING'),
      attendanceRate: this.ratio(present, expectedActivities),
      punctualityRate: this.ratio(onTime, present),
    };
  }

  static aggregate(members: MemberStatistics[]): AggregateStatistics {
    const totals = members.reduce(
      (acc, member) => ({
        expectedActivities: acc.expectedActivities + member.expectedActivities,
        present: acc.present + member.present,
        absent: acc.absent + member.absent,
        onTime: acc.onTime + member.onTime,
        late: acc.late + member.late,
        severelyLate: acc.severelyLate + member.severelyLate,
        minutesLateTotal: acc.minutesLateTotal + member.minutesLateTotal,
        durationMinutesTotal:
          acc.durationMinutesTotal + member.durationMinutesTotal,
        completeParticipations:
          acc.completeParticipations + member.completeParticipations,
        partialParticipations:
          acc.partialParticipations + member.partialParticipations,
        insufficientParticipations:
          acc.insufficientParticipations + member.insufficientParticipations,
        pendingParticipations:
          acc.pendingParticipations + member.pendingParticipations,
      }),
      {
        expectedActivities: 0,
        present: 0,
        absent: 0,
        onTime: 0,
        late: 0,
        severelyLate: 0,
        minutesLateTotal: 0,
        durationMinutesTotal: 0,
        completeParticipations: 0,
        partialParticipations: 0,
        insufficientParticipations: 0,
        pendingParticipations: 0,
      },
    );

    return {
      ...totals,
      averageMinutesLate: this.ratio(totals.minutesLateTotal, totals.present),
      attendanceRate: this.ratio(totals.present, totals.expectedActivities),
      punctualityRate: this.ratio(totals.onTime, totals.present),
    };
  }

  private static ratio(numerator: number, denominator: number): number {
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 10000) / 10000;
  }
}
