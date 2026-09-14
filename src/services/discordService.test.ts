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

  describe('sendTaskCompleted', () => {
    it('should send a green embed when a task is completed', async () => {
      await discordService.sendTaskCompleted('Urgent Work', 'Finish report', 'most');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.embeds).toBeDefined();
      expect(body.embeds[0].color).toBe(5763719); // Discord Green
      expect(body.embeds[0].description).toContain('✅ **DONE:** MOST - Finish report / Urgent Work');
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

      expect(body.content).toContain('BATCH UPDATE');
      expect(body.content).toContain(formatThaiDate(new Date()));
      expect(body.content).toContain('MOST COMPLETED:');
      expect(body.content).toContain('- Buy milk / Groceries');
      expect(body.content).toContain('FERN COMPLETED:');
      expect(body.content).toContain('- Buy eggs / Groceries');
    });
  });

  describe('sendNightlyReminder', () => {
    it('should send the 22:30 check-in message', async () => {
      await discordService.sendNightlyReminder();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.content).toContain('SYSTEM CHECK: 22:30');
      expect(body.content).toContain('FINAL REVIEW BEFORE TOMORROW.');
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

      expect(body.content).toContain('DAILY SUMMARY: 12 Sep 2026');
      expect(body.content).toContain('TOTAL: 12');
      expect(body.content).toContain('COMPLETED: 8');
      expect(body.content).toContain('PENDING: 4');
      expect(body.content).toContain('RATE: 67%');
      expect(body.content).toContain('MOST DONE: 5');
      expect(body.content).toContain('FERN DONE: 3');
      expect(body.content).toContain('PENDING TASKS:');
      expect(body.content).toContain('URGENT WORK');
      expect(body.content).toContain('- Finish report | MOST');
      expect(body.content).toContain('- Review slides | BOTH');
      expect(body.content).toContain('HOUSE CHORES');
      expect(body.content).toContain('- Clean room | FERN');
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

      expect(body.content).toContain('STATUS: NO PENDING TASKS');
    });
  });

  describe('error handling', () => {
    it('should not send if webhook url is missing', async () => {
      const getWebhookUrlSpy = vi.spyOn(discordService, 'getWebhookUrl').mockReturnValue(undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await discordService.sendNightlyReminder();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      getWebhookUrlSpy.mockRestore();
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
