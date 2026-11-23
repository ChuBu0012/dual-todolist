import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './check.js';
import * as firestore from 'firebase/firestore';
import { discordService } from '../../src/services/discordService.js';
import { firestoreService } from '../../src/services/firestoreService.js';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn(),
    getDocs: vi.fn(),
  };
});

describe('api/reminders/check', () => {
  let req: any;
  let res: any;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-secret');
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
      query: {},
    };
    res = {
      status: statusMock,
    };
    vi.spyOn(discordService, 'sendTaskReminder').mockResolvedValue();
    vi.spyOn(firestoreService, 'updateCard').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject unauthorized requests when CRON_SECRET is set', async () => {
    req.headers = { authorization: 'Bearer wrong-secret' };
    await handler(req as VercelRequest, res as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it('should accept valid secret from query param or header', async () => {
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({
      size: 0,
      docs: [],
    } as any);

    req.headers = {};
    req.query = { secret: 'test-secret' };

    await handler(req as VercelRequest, res as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        checkedCards: 0,
        remindersSent: 0,
      })
    );
  });

  it('should send reminder and update card in firestore when an item is due', async () => {
    // Current Bangkok time
    const now = new Date();
    const bangkokNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const timeStr = `${String(bangkokNow.getHours()).padStart(2, '0')}:${String(bangkokNow.getMinutes()).padStart(2, '0')}`;

    const mockCard = {
      id: 'card-1',
      title: 'Work Tasks',
      assignee: 'most',
      items: [
        {
          id: 'item-1',
          text: `!${timeStr} important call`,
          isDone: false,
        },
      ],
    };

    vi.mocked(firestore.getDocs).mockResolvedValueOnce({
      size: 1,
      docs: [
        {
          id: 'card-1',
          data: () => mockCard,
        },
      ],
    } as any);

    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(discordService.sendTaskReminder).toHaveBeenCalledWith(
      'Work Tasks',
      `!${timeStr} important call`,
      'most',
      'due'
    );
    expect(firestoreService.updateCard).toHaveBeenCalledWith('card-1', {
      items: [
        expect.objectContaining({
          id: 'item-1',
          reminded_time: timeStr,
          reminded_due: true,
        }),
      ],
    });
  });
});
