import { describe, it, expect, vi, beforeEach } from 'vitest';
import batchHandler from './batch-completions';
import summaryHandler from './daily-summary';
import { firestoreService } from '../../src/services/firestoreService';
import { discordService } from '../../src/services/discordService';

vi.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    getUnnotifiedCompletedTasks: vi.fn(),
    markCompletedTasksAsNotified: vi.fn(),
    getAllCards: vi.fn(),
  },
}));

vi.mock('../../src/services/discordService', () => ({
  discordService: {
    sendBatchedCompletions: vi.fn(),
    sendNightlyReminder: vi.fn(),
    sendDailySummaryFormatted: vi.fn(),
  },
}));

describe('Vercel Cron Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('batch-completions', () => {
    it('should process unnotified tasks, send discord batch, and mark notified', async () => {
      const mockTasks = [
        {
          id: 'card1_item1',
          cardId: 'card1',
          cardTitle: 'Work',
          itemId: 'item1',
          itemText: 'Report',
          completedBy: 'most',
          completedAt: '2026-09-12T10:00:00.000Z',
          dateStr: '12/09/69',
          notified: false,
        },
      ];

      vi.mocked(firestoreService.getUnnotifiedCompletedTasks).mockResolvedValueOnce(mockTasks as any);
      vi.mocked(discordService.sendBatchedCompletions).mockResolvedValueOnce(undefined);
      vi.mocked(firestoreService.markCompletedTasksAsNotified).mockResolvedValueOnce(undefined);

      const jsonMock = vi.fn();
      const res = {
        status: vi.fn().mockReturnValue({ json: jsonMock }),
      };

      await batchHandler({} as any, res as any);

      expect(firestoreService.getUnnotifiedCompletedTasks).toHaveBeenCalled();
      expect(discordService.sendBatchedCompletions).toHaveBeenCalledWith(mockTasks);
      expect(firestoreService.markCompletedTasksAsNotified).toHaveBeenCalledWith(['card1_item1']);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, processed: 1 })
      );
    });

    it('should handle zero tasks gracefully without sending discord message', async () => {
      vi.mocked(firestoreService.getUnnotifiedCompletedTasks).mockResolvedValueOnce([]);

      const jsonMock = vi.fn();
      const res = {
        status: vi.fn().mockReturnValue({ json: jsonMock }),
      };

      await batchHandler({} as any, res as any);

      expect(discordService.sendBatchedCompletions).not.toHaveBeenCalled();
      expect(firestoreService.markCompletedTasksAsNotified).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, processed: 0 })
      );
    });
  });

  describe('daily-summary (22:00 Check-in & Summary)', () => {
    it('should send nightly reminder and formatted summary calculation', async () => {
      const mockCards = [
        {
          id: 'c1',
          title: 'Card 1',
          assignee: 'most',
          items: [
            { id: 'i1', text: 'Task 1', isDone: true, completedBy: 'most' },
            { id: 'i2', text: 'Task 2', isDone: false },
          ],
        },
        {
          id: 'c2',
          title: 'Card 2',
          assignee: 'fern',
          items: [
            { id: 'i3', text: 'Task 3', isDone: true, completedBy: 'fern' },
          ],
        },
      ];

      vi.mocked(firestoreService.getAllCards).mockResolvedValueOnce(mockCards as any);
      vi.mocked(discordService.sendNightlyReminder).mockResolvedValueOnce(undefined);
      vi.mocked(discordService.sendDailySummaryFormatted).mockResolvedValueOnce(undefined);

      const jsonMock = vi.fn();
      const res = {
        status: vi.fn().mockReturnValue({ json: jsonMock }),
      };

      await summaryHandler({} as any, res as any);

      expect(discordService.sendNightlyReminder).toHaveBeenCalled();
      expect(discordService.sendDailySummaryFormatted).toHaveBeenCalledWith(
        expect.objectContaining({
          totalItems: 3,
          completedCount: 2,
          pendingCount: 1,
          mostCompletedCount: 1,
          fernCompletedCount: 1,
          pendingByCard: [
            {
              cardTitle: 'Card 1',
              items: [{ text: 'Task 2', assignee: 'most' }],
            },
          ],
        })
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          summary: {
            totalItems: 3,
            completedCount: 2,
            pendingCount: 1,
            mostCompletedCount: 1,
            fernCompletedCount: 1,
          },
        })
      );
    });
  });
});

