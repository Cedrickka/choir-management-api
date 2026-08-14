import { AttendanceCalculator } from './attendance-calculator';

describe('AttendanceCalculator', () => {
  const start = new Date('2026-08-14T17:00:00Z');
  it('calculates an 11-minute delay from server time', () =>
    expect(
      AttendanceCalculator.arrival(start, new Date('2026-08-14T17:11:00Z')),
    ).toEqual({ status: 'LATE', minutesLate: 11 }));
  it('classifies severe delay at the configured threshold', () =>
    expect(
      AttendanceCalculator.arrival(start, new Date('2026-08-14T17:30:00Z'))
        .status,
    ).toBe('SEVERELY_LATE'));
  it('calculates duration and partial participation', () =>
    expect(
      AttendanceCalculator.participation(
        start,
        new Date('2026-08-14T18:30:00Z'),
        start,
        new Date('2026-08-14T19:00:00Z'),
      ),
    ).toEqual({ durationMinutes: 90, participationStatus: 'PARTIAL' }));
});
