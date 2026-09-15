import { discordService } from '../../src/services/discordService.js';
import { firestoreService } from '../../src/services/firestoreService.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Running 22:00 Daily Checkin + Summary...');

    // Fetch all cards and compute summary
    const cards = await firestoreService.getAllCards();

    // Use ICT (Asia/Bangkok, UTC+7) to match card timestamps
    const now = new Date();
    // If run past midnight (between 00:00 and 03:00 ICT), subtract 1 day to fetch "yesterday's" cards
    const ictTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    if (ictTime.getUTCHours() < 3) {
      ictTime.setDate(ictTime.getUTCDate() - 1);
    }
    const todayStr = ictTime.toISOString().split('T')[0];

    const getIctDateStr = (dateString: string) => {
      const d = new Date(dateString);
      return new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    };

    const activeCards = cards.filter(card => {
      // Include if created today, updated today
      const createdStr = card.createdAt ? getIctDateStr(card.createdAt) : '';
      const updatedStr = card.updatedAt ? getIctDateStr(card.updatedAt) : '';
      return createdStr === todayStr || updatedStr === todayStr;
    });

    if (activeCards.length === 0) {
      console.log('[CRON] No active tasks for today. Skipping 22:00 notifications.');
      return res.status(200).json({ success: true, message: 'No tasks today, skipped.' });
    }

    // 1. Send checkin reminder first
    await discordService.sendCheckinReminder();

    // 2. Wait 2 seconds before sending the full summary
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Compute summary stats
    let totalItems = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let mostCompletedCount = 0;
    let fernCompletedCount = 0;

    const pendingByCard: Array<{ cardTitle: string; items: Array<{ text: string; assignee: string }> }> = [];

    activeCards.forEach(card => {
      if (!card.items || card.items.length === 0) return;

      const pendingItems: Array<{ text: string; assignee: string }> = [];

      card.items.forEach(item => {
        totalItems++;
        if (item.isDone) {
          completedCount++;
          if (item.completedBy === 'most') mostCompletedCount++;
          else if (item.completedBy === 'fern') fernCompletedCount++;
        } else {
          pendingCount++;
          // Assignee falls back to card-level assignee
          pendingItems.push({ text: item.text, assignee: card.assignee || 'both' });
        }
      });

      if (pendingItems.length > 0) {
        pendingByCard.push({
          cardTitle: card.title || 'Untitled',
          items: pendingItems
        });
      }
    });

    // 4. Send the formatted summary
    await discordService.sendDailySummaryFormatted({
      totalItems,
      completedCount,
      pendingCount,
      mostCompletedCount,
      fernCompletedCount,
      pendingByCard
    });

    console.log('[CRON] Successfully sent 22:00 checkin + summary');
    return res.status(200).json({ success: true, message: '22:00 checkin + summary sent' });
  } catch (error: any) {
    console.error('[CRON] 22:00 notification failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
