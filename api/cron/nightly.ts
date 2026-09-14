import { discordService } from '../../src/services/discordService.js';
import { firestoreService } from '../../src/services/firestoreService.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Running 22:00 Daily Checkin + Summary...');

    // Fetch all cards and compute summary
    const cards = await firestoreService.getAllCards();

    // Check if there's any work today
    // Use ICT (Asia/Bangkok, UTC+7) to match card timestamps stored by browser
    const now = new Date();
    const todayStr = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];

    const activeCards = cards.filter(card => {
      // Include if created today, updated today, or has pending items and was updated recently
      const createdStr = card.createdAt ? new Date(card.createdAt).toISOString().split('T')[0] : '';
      const updatedStr = card.updatedAt ? new Date(card.updatedAt).toISOString().split('T')[0] : '';
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
