import { discordService } from '../../src/services/discordService';
import { firestoreService } from '../../src/services/firestoreService';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Running 22:30 Daily Summary...');
    
    // 1. Send the cute intro message
    await discordService.sendNightlyReminder();

    // 2. Fetch all cards and compute summary
    const cards = await firestoreService.getAllCards();
    
    let totalItems = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let mostCompletedCount = 0;
    let fernCompletedCount = 0;
    
    const pendingByCard: Array<{ cardTitle: string; items: Array<{ text: string; assignee: string }> }> = [];

    cards.forEach(card => {
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

    // 3. Send the formatted summary
    await discordService.sendDailySummaryFormatted({
      totalItems,
      completedCount,
      pendingCount,
      mostCompletedCount,
      fernCompletedCount,
      pendingByCard
    });

    console.log('[CRON] Successfully sent 22:30 summary');
    return res.status(200).json({ success: true, message: '22:30 summary sent' });
  } catch (error: any) {
    console.error('[CRON] 22:30 summary failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
