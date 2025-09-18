import { vi } from 'vitest';
import { DateTime as ActualDateTime } from 'luxon';

const mockDate = ActualDateTime.fromObject({ year: 2025, month: 3, day: 17, hour: 10, minute: 30, second: 0 });

export const DateTime = {
  ...ActualDateTime,
  now: vi.fn(() => mockDate),
  fromISO: vi.fn((iso: string) => ActualDateTime.fromISO(iso)),
  fromJSDate: vi.fn((date: Date) => ActualDateTime.fromJSDate(date)),
  // Add other methods if they are used in the components and need to be mocked
  // For example, if you use `startOf`, `endOf`, `plus`, etc.
  startOf: vi.fn((unit: string) => mockDate.startOf(unit)),
  endOf: vi.fn((unit: string) => mockDate.endOf(unit)),
  plus: vi.fn((duration: object) => mockDate.plus(duration)),
  diff: vi.fn((other: ActualDateTime, unit: string) => mockDate.diff(other, unit)),
  toLocaleString: vi.fn((format: object) => mockDate.toLocaleString(format)),
  setLocale: vi.fn((locale: string) => mockDate.setLocale(locale)),
};