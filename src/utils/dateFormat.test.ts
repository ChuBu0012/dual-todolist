import { describe, it, expect } from 'vitest';
import { formatThaiDate, formatSummaryDate, getBangkokDateString, getLast30Days } from './dateFormat';

describe('dateFormat', () => {
  it('should format date to DD/MM/YY in Thai Buddhist Era (e.g. 12/09/69)', () => {
    // 2026-09-12T12:00:00Z
    const testDate = new Date('2026-09-12T12:00:00Z');
    expect(formatThaiDate(testDate)).toBe('12/09/69');
  });

  it('should format summary date to "12 Sep 2026"', () => {
    const testDate = new Date('2026-09-12T12:00:00Z');
    expect(formatSummaryDate(testDate)).toBe('12 Sep 2026');
  });

  it('should handle single digit days and months with leading zeros in Thai format', () => {
    const testDate = new Date('2026-01-05T12:00:00Z');
    expect(formatThaiDate(testDate)).toBe('05/01/69');
  });

  it('should return YYYY-MM-DD from getBangkokDateString', () => {
    const testDate = new Date('2026-09-14T05:00:00Z'); // 12:00 in Bangkok
    expect(getBangkokDateString(testDate)).toBe('2026-09-14');
  });

  it('should return 30 items from getLast30Days ending with today', () => {
    const days = getLast30Days();
    expect(days).toHaveLength(30);
    const today = getBangkokDateString(new Date());
    expect(days[29]).toBe(today);
  });
});

