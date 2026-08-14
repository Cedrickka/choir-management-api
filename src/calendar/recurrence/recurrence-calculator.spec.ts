import { RecurrenceCalculator } from './recurrence-calculator';
describe('RecurrenceCalculator', () => {
  it('generates weekly occurrences on selected ISO weekdays', () => {
    const dates = RecurrenceCalculator.generate(
      '2026-08-03T18:00:00+01:00',
      'Africa/Kinshasa',
      {
        type: 'WEEKLY',
        daysOfWeek: [1, 4],
        until: '2026-08-13T23:00:00+01:00',
      },
    );
    expect(dates.map((x) => x.toISOString())).toEqual([
      '2026-08-03T17:00:00.000Z',
      '2026-08-06T17:00:00.000Z',
      '2026-08-10T17:00:00.000Z',
      '2026-08-13T17:00:00.000Z',
    ]);
  });
  it('generates monthly occurrences without changing local time', () => {
    const dates = RecurrenceCalculator.generate(
      '2026-08-15T18:00:00+01:00',
      'Africa/Kinshasa',
      { type: 'MONTHLY', interval: 1, until: '2026-10-15T18:00:00+01:00' },
    );
    expect(dates).toHaveLength(3);
  });
  it('preserves local time across daylight-saving changes', () => {
    const dates = RecurrenceCalculator.generate(
      '2026-03-22T18:00:00+01:00',
      'Europe/Paris',
      { type: 'WEEKLY', until: '2026-03-29T18:00:00+02:00' },
    );
    expect(dates.map((date) => date.toISOString())).toEqual([
      '2026-03-22T17:00:00.000Z',
      '2026-03-29T16:00:00.000Z',
    ]);
  });
  it('rejects unbounded oversized series', () => {
    expect(() =>
      RecurrenceCalculator.generate(
        '2026-01-01T10:00:00Z',
        'UTC',
        {
          type: 'WEEKLY',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
          until: '2028-01-01T10:00:00Z',
        },
        10,
      ),
    ).toThrow('exceeds');
  });
});
