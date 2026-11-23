import type { ChecklistItem } from '../types/todo.js';

export interface ParsedReminder {
  isAdvance: boolean;
  timeStr: string;
  hour: number;
  minute: number;
}

/**
 * Parses reminder time from task text.
 * Matches: !HH.MM, !HH:MM, !!HH.MM, !!HH:MM
 */
export function parseReminder(text: string): ParsedReminder | null {
  const match = text.match(/(!{1,2})(\d{1,2})[.:](\d{2})/);
  if (!match) return null;

  const hour = parseInt(match[2], 10);
  const minute = parseInt(match[3], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const isAdvance = match[1] === '!!';
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return {
    isAdvance,
    timeStr,
    hour,
    minute,
  };
}

export type ReminderAction = 'soon' | 'due' | null;

export interface ReminderEvaluation {
  action: ReminderAction;
  timeStr: string;
}

/**
 * Evaluates whether a checklist item is due for a reminder.
 */
export function evaluateReminder(
  item: ChecklistItem,
  now: Date = new Date()
): ReminderEvaluation {
  if (item.isDone) {
    return { action: null, timeStr: '' };
  }

  const parsed = parseReminder(item.text);
  if (!parsed) {
    return { action: null, timeStr: '' };
  }

  // Get current Bangkok time components
  const bangkokNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const currentMinutes = bangkokNow.getHours() * 60 + bangkokNow.getMinutes();
  const targetMinutes = parsed.hour * 60 + parsed.minute;

  // diff in minutes (positive = future, negative = past)
  const diffMinutes = targetMinutes - currentMinutes;

  // Check if user changed the time since last reminded
  const isTimeChanged = item.reminded_time !== parsed.timeStr;
  const remindedSoon = isTimeChanged ? false : !!item.reminded_soon;
  const remindedDue = isTimeChanged ? false : !!item.reminded_due;

  // If exact (!HH.MM)
  if (!parsed.isAdvance) {
    // Due window: 0 to 5 minutes after due time
    if (diffMinutes <= 0 && diffMinutes >= -5 && !remindedDue) {
      return { action: 'due', timeStr: parsed.timeStr };
    }
    return { action: null, timeStr: parsed.timeStr };
  }

  // If advance (!!HH.MM)
  // Step 1: Soon alert (between 1 and 15 minutes before due time)
  if (diffMinutes <= 15 && diffMinutes > 0 && !remindedSoon && !remindedDue) {
    return { action: 'soon', timeStr: parsed.timeStr };
  }

  // Step 2: Due alert (0 to 5 minutes after due time)
  if (diffMinutes <= 0 && diffMinutes >= -5 && !remindedDue) {
    return { action: 'due', timeStr: parsed.timeStr };
  }

  return { action: null, timeStr: parsed.timeStr };
}
