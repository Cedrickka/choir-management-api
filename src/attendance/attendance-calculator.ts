export type AttendanceResult = {
  status: 'PRESENT' | 'LATE' | 'SEVERELY_LATE';
  minutesLate: number;
};

export class AttendanceCalculator {
  static arrival(
    startsAt: Date,
    arrivedAt: Date,
    severeLateMinutes = 30,
  ): AttendanceResult {
    const minutesLate = Math.max(
      0,
      Math.floor((arrivedAt.getTime() - startsAt.getTime()) / 60000),
    );
    return {
      status:
        minutesLate === 0
          ? 'PRESENT'
          : minutesLate >= severeLateMinutes
            ? 'SEVERELY_LATE'
            : 'LATE',
      minutesLate,
    };
  }

  static participation(
    arrivedAt: Date,
    leftAt: Date,
    startsAt: Date,
    endsAt: Date,
    minimumRatio = 0.75,
  ) {
    const durationMinutes = Math.max(
      0,
      Math.floor((leftAt.getTime() - arrivedAt.getTime()) / 60000),
    );
    const plannedMinutes = Math.max(
      1,
      Math.floor((endsAt.getTime() - startsAt.getTime()) / 60000),
    );
    const ratio = durationMinutes / plannedMinutes;
    return {
      durationMinutes,
      participationStatus:
        ratio >= 1
          ? ('COMPLETE' as const)
          : ratio >= minimumRatio
            ? ('PARTIAL' as const)
            : ('INSUFFICIENT' as const),
    };
  }
}
