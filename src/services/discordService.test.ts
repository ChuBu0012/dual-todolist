import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { discordService, splitDiscordMessage } from './discordService';
import type { CompletedTaskLog } from '../types/todo';
import { formatThaiDate } from '../utils/dateFormat';

describe('discordService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DISCORD_WEBHOOK_URL', 'https://mock-discord.com/api/webhooks/123');
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('splitDiscordMessage', () => {
    it('should not split if text is within limit', () => {
      const text = 'Short message';
      expect(splitDiscordMessage(text, 100)).toEqual(['Short message']);
    });

    it('should split into chunks at line breaks when exceeding limit', () => {
      const text = 'Line 1\nLine 2\nLine 3\nLine 4';
      const chunks = splitDiscordMessage(text, 15);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(15);
      });
    });
  });

  describe('sendBatchedCompletions', () => {
    it('should not send if logs array is empty', async () => {
      await discordService.sendBatchedCompletions([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should format and send batched completions grouped by person', async () => {
      const mockLogs: CompletedTaskLog[] = [
        {
          id: '1',
          cardId: 'card-1',
          cardTitle: 'Groceries',
          itemId: 'item-1',
          itemText: 'Buy milk',
          completedBy: 'most',
          completedAt: '2026-09-12T10:00:00.000Z',
          dateStr: '12/09/69',
          notified: false,
        },
        {
          id: '2',
          cardId: 'card-1',
          cardTitle: 'Groceries',
          itemId: 'item-2',
          itemText: 'Buy eggs',
          completedBy: 'fern',
          completedAt: '2026-09-12T10:10:00.000Z',
          dateStr: '12/09/69',
          notified: false,
        },
      ];

      await discordService.sendBatchedCompletions(mockLogs);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.content).toContain('Dual Todo · สรุปงานที่เสร็จ (รอบ 30 นาที)');
      expect(body.content).toContain(formatThaiDate(new Date()));
      expect(body.content).toContain('Most completed (1):');
      expect(body.content).toContain('[Groceries] Buy milk');
      expect(body.content).toContain('Fern completed (1):');
      expect(body.content).toContain('[Groceries] Buy eggs');
    });
  });

  describe('sendNightlyReminder', () => {
    it('should send the 22:00 check-in message', async () => {
      await discordService.sendNightlyReminder();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.content).toContain('22:00 Check-in');
      expect(body.content).toContain('มี Todo อะไรอยากจดไว้ไหมนะ?');
      expect(body.content).toContain('Most & Fern');
    });
  });

  describe('sendDailySummaryFormatted', () => {
    it('should format summary with completion rate and pending grouped by card', async () => {
      await discordService.sendDailySummaryFormatted({
        date: new Date('2026-09-12T12:00:00Z'),
        totalItems: 12,
        completedCount: 8,
        pendingCount: 4,
        mostCompletedCount: 5,
        fernCompletedCount: 3,
        pendingByCard: [
          {
            cardTitle: 'Urgent Work',
            items: [
              { text: 'Finish report', assignee: 'most' },
              { text: 'Review slides', assignee: 'both' },
            ],
          },
          {
            cardTitle: 'House Chores',
            items: [{ text: 'Clean room', assignee: 'fern' }],
          },
        ],
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.content).toContain('Dual Todo Summary · 12 Sep 2026');
      expect(body.content).toContain('Total items: 12');
      expect(body.content).toContain('Completed: 8');
      expect(body.content).toContain('Pending: 4');
      expect(body.content).toContain('Completion rate: 67%');
      expect(body.content).toContain('Most completed: 5');
      expect(body.content).toContain('Fern completed: 3');
      expect(body.content).toContain('รายการค้าง จัดกลุ่มตามการ์ด:');
      expect(body.content).toContain('• **Urgent Work**');
      expect(body.content).toContain('- Finish report (Most)');
      expect(body.content).toContain('- Review slides (Both)');
      expect(body.content).toContain('• **House Chores**');
      expect(body.content).toContain('- Clean room (Fern)');
    });

    it('should handle zero pending items with a praise message', async () => {
      await discordService.sendDailySummaryFormatted({
        date: new Date('2026-09-12T12:00:00Z'),
        totalItems: 5,
        completedCount: 5,
        pendingCount: 0,
        mostCompletedCount: 3,
        fernCompletedCount: 2,
        pendingByCard: [],
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.content).toContain('ไม่มีรายการค้าง เก่งมากทั้งคู่เลย!');
    });
  });

  describe('error handling', () => {
    it('should not send if webhook url is missing', async () => {
      vi.stubEnv('VITE_DISCORD_WEBHOOK_URL', '');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await discordService.sendNightlyReminder();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should throw if fetch fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(discordService.sendNightlyReminder()).rejects.toThrow('Discord Webhook failed');
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
