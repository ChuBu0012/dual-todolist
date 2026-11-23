import { describe, it, expect } from 'vitest';
import { parseReminder, evaluateReminder } from './reminderUtils.js';
import type { ChecklistItem } from '../types/todo.js';

describe('reminderUtils', () => {
  describe('parseReminder', () => {
    it('should parse exact time with dot or colon', () => {
      expect(parseReminder('!14.30 buy milk')).toEqual({
        isAdvance: false,
        timeStr: '14:30',
        hour: 14,
        minute: 30,
      });

      expect(parseReminder('!9:05 clean room')).toEqual({
        isAdvance: false,
        timeStr: '09:05',
        hour: 9,
        minute: 5,
      });
    });

    it('should parse advance alert (!!)', () => {
      expect(parseReminder('!!18.00 dinner with mom')).toEqual({
        isAdvance: true,
        timeStr: '18:00',
        hour: 18,
        minute: 0,
      });
    });

    it('should return null for invalid hours or minutes', () => {
      expect(parseReminder('!25.00 invalid hour')).toBeNull();
      expect(parseReminder('!12.75 invalid minute')).toBeNull();
      expect(parseReminder('regular task without time')).toBeNull();
    });
  });

  describe('evaluateReminder', () => {
    // Helper to create a Date in Bangkok time (UTC+7)
    // 2026-11-23T14:30:00+07:00 => 2026-11-23T07:30:00Z
    const createBangkokDate = (hour: number, minute: number): Date => {
      const d = new Date('2026-11-23T00:00:00Z');
      // UTC hour = Bangkok hour - 7
      d.setUTCHours(hour - 7, minute, 0, 0);
      return d;
    };

    it('should return null for completed items', () => {
      const item: ChecklistItem = {
        id: '1',
        text: '!14.30 take medicine',
        isDone: true,
      };
      const now = createBangkokDate(14, 30);
      expect(evaluateReminder(item, now)).toEqual({ action: null, timeStr: '' });
    });

    it('should trigger due alert at exact time for !HH.MM', () => {
      const item: ChecklistItem = {
        id: '1',
        text: '!14.30 take medicine',
        isDone: false,
      };
      const now1420 = createBangkokDate(14, 20);
      expect(evaluateReminder(item, now1420).action).toBeNull();

      const now1430 = createBangkokDate(14, 30);
      expect(evaluateReminder(item, now1430)).toEqual({ action: 'due', timeStr: '14:30' });

      // If already reminded_due, do not trigger again
      const remindedItem: ChecklistItem = {
        ...item,
        reminded_time: '14:30',
        reminded_due: true,
      };
      expect(evaluateReminder(remindedItem, now1430).action).toBeNull();
    });

    it('should trigger soon alert (15m before) and then due alert for !!HH.MM', () => {
      const item: ChecklistItem = {
        id: '1',
        text: '!!15.00 meeting',
        isDone: false,
      };

      // 20 mins before: null
      expect(evaluateReminder(item, createBangkokDate(14, 40)).action).toBeNull();

      // 15 mins before: soon
      const soonEval = evaluateReminder(item, createBangkokDate(14, 45));
      expect(soonEval).toEqual({ action: 'soon', timeStr: '15:00' });

      // After marked as soon, 10 mins before: null
      const soonMarked: ChecklistItem = {
        ...item,
        reminded_time: '15:00',
        reminded_soon: true,
      };
      expect(evaluateReminder(soonMarked, createBangkokDate(14, 50)).action).toBeNull();

      // At exact time: due
      expect(evaluateReminder(soonMarked, createBangkokDate(15, 0))).toEqual({
        action: 'due',
        timeStr: '15:00',
      });
    });

    it('should auto-reset when user modifies the reminder time', () => {
      // User had an item that was already reminded at 14:00
      const item: ChecklistItem = {
        id: '1',
        text: '!15.00 updated time',
        isDone: false,
        reminded_time: '14:00',
        reminded_due: true,
      };

      // Now at 15:00, since reminded_time !== '15:00', it should fire due!
      const now1500 = createBangkokDate(15, 0);
      expect(evaluateReminder(item, now1500)).toEqual({
        action: 'due',
        timeStr: '15:00',
      });
    });

    it('should not alert for old past overdue tasks (more than 5 mins ago)', () => {
      const item: ChecklistItem = {
        id: '1',
        text: '!09.00 morning standup',
        isDone: false,
      };
      // Current time is 14:00 (5 hours later)
      const now1400 = createBangkokDate(14, 0);
      expect(evaluateReminder(item, now1400).action).toBeNull();
    });
  });
});
