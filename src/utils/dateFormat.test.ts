import { describe, it, expect } from 'vitest';
import { formatThaiDate, formatSummaryDate, getBangkokDateString, getLast30Days, getBangkokTomorrow } from './dateFormat';

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

  describe('getBangkokTomorrow', () => {
    it('should return tomorrow relative to Bangkok timezone', () => {
      // 2026-09-12 12:00 UTC = 19:00 Bangkok on 2026-09-12
      const testDate = new Date('2026-09-12T12:00:00Z');
      const tomorrow = getBangkokTomorrow(testDate);
      expect(formatThaiDate(tomorrow)).toBe('13/09/69');
    });

    it('should accurately calculate tomorrow when UTC is previous day (midnight boundary)', () => {
      // 2026-09-12 18:00 UTC = 2026-09-13 01:00 Bangkok
      // In Bangkok, today is 13/09/69, so tomorrow should be 14/09/69
      const testDate = new Date('2026-09-12T18:00:00Z');
      const tomorrow = getBangkokTomorrow(testDate);
      expect(formatThaiDate(tomorrow)).toBe('14/09/69');
    });

    it('should handle month-end boundary correctly', () => {
      // 2026-10-31 18:00 UTC = 2026-11-01 01:00 Bangkok
      // In Bangkok, today is 01/11/69, so tomorrow should be 02/11/69
      const testDate = new Date('2026-10-31T18:00:00Z');
      const tomorrow = getBangkokTomorrow(testDate);
      expect(formatThaiDate(tomorrow)).toBe('02/11/69');
    });
  });
});

