import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './interactions.js';
import { firestoreService } from '../../src/services/firestoreService.js';
import nacl from 'tweetnacl';

vi.mock('../../src/services/firestoreService.js', () => ({
  firestoreService: {
    getAllCards: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
  }
}));

vi.mock('@vercel/functions', () => ({
  waitUntil: (promise: Promise<any>) => promise, // Just await it in tests implicitly or ignore
}));

// Mock fetch for sendFollowUp
global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;

describe('Discord Interactions Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DISCORD_PUBLIC_KEY = 'a'.repeat(64);
    process.env.DISCORD_APP_ID = 'test-app-id';
  });

  const createMockReqRes = (body: any) => {
    const rawBody = JSON.stringify(body);
    const req: any = {
      method: 'POST',
      headers: {
        'x-signature-ed25519': 'fake-sig',
        'x-signature-timestamp': '1234567890',
      },
      // Simulate async iterator for getRawBody
      [Symbol.asyncIterator]: async function* () {
        yield rawBody;
      }
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    return { req, res, rawBody };
  };

  it('should return 401 if signature is missing', async () => {
    const { req, res } = createMockReqRes({});
    delete req.headers['x-signature-ed25519'];

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should verify signature and respond with type 1 for PING', async () => {
    // Mock nacl to always verify true for this test
    vi.spyOn(nacl.sign.detached, 'verify').mockReturnValue(true);
    
    const { req, res } = createMockReqRes({ type: 1 });
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ type: 1 });
  });

  it('should respond with DEFERRED (type 5) for /daily command', async () => {
    vi.spyOn(nacl.sign.detached, 'verify').mockReturnValue(true);
    vi.mocked(firestoreService.getAllCards).mockResolvedValue([]); // No cards yet
    
    const { req, res } = createMockReqRes({ 
      type: 2, 
      token: 'fake-token',
      data: {
        name: 'daily',
        options: [{ name: 'items', value: 'Task 1' }]
      }
    });

    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ type: 5 });
    
    // We mocked waitUntil to just execute the promise. 
    // Wait for the event loop to settle so background async task finishes.
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(firestoreService.createCard).toHaveBeenCalled();
    const createCall = vi.mocked(firestoreService.createCard).mock.calls[0][0];
    expect(createCall.items?.length).toBe(1);
    expect(createCall.items?.[0].text).toBe('Task 1');
    // Title should be today's date formatted
    expect(createCall.title).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  });
});
