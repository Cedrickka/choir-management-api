import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
export type RecurrenceRule = {
  type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  interval?: number;
  daysOfWeek?: number[];
  customDates?: string[];
  until: string;
};
export class RecurrenceCalculator {
  static generate(
    startsAt: string,
    timezone: string,
    rule: RecurrenceRule,
    max = 500,
  ): Date[] {
    const start = DateTime.fromISO(startsAt, { setZone: true }).setZone(
      timezone,
    );
    const until = DateTime.fromISO(rule.until, { setZone: true }).setZone(
      timezone,
    );
    const interval = rule.interval || 1;
    if (!start.isValid || !until.isValid || until < start || interval < 1)
      throw new BadRequestException('Invalid recurrence rule');
    let dates: DateTime[] = [];
    if (rule.type === 'CUSTOM') {
      dates = (rule.customDates || [])
        .map((x) => DateTime.fromISO(x, { setZone: true }).setZone(timezone))
        .filter((x) => x.isValid && x >= start && x <= until)
        .sort((a, b) => a.toMillis() - b.toMillis());
    }
    if (rule.type === 'MONTHLY') {
      let index = 0;
      while (dates.length <= max) {
        const cursor = start.plus({ months: index });
        if (cursor > until) break;
        if (cursor.day === start.day) dates.push(cursor);
        index += interval;
      }
    }
    if (rule.type === 'WEEKLY') {
      const days = [
        ...new Set(rule.daysOfWeek?.length ? rule.daysOfWeek : [start.weekday]),
      ];
      if (days.some((x) => x < 1 || x > 7))
        throw new BadRequestException('daysOfWeek must use ISO values 1..7');
      let cursor = start.startOf('day');
      while (cursor <= until && dates.length <= max) {
        const weeks = Math.floor(
          cursor.startOf('week').diff(start.startOf('week'), 'weeks').weeks,
        );
        if (weeks % interval === 0 && days.includes(cursor.weekday)) {
          const occurrence = cursor.set({
            hour: start.hour,
            minute: start.minute,
            second: start.second,
            millisecond: start.millisecond,
          });
          if (occurrence >= start && occurrence <= until)
            dates.push(occurrence);
        }
        cursor = cursor.plus({ days: 1 });
      }
    }
    const unique = [
      ...new Map(dates.map((x) => [x.toUTC().toISO(), x])).values(),
    ];
    if (unique.length > max)
      throw new BadRequestException(`Recurrence exceeds ${max} occurrences`);
    return unique.map((x) => x.toJSDate());
  }
}
