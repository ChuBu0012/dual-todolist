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
    
        // 2. Fetch all cards and compute summary
    const cards = await firestoreService.getAllCards();
    
    // Check if there's any work today
    // Use ICT (Asia/Bangkok, UTC+7) to match card timestamps stored by browser
    const now = new Date();
    const todayStr = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const activeCards = cards.filter(card => {
      // Include if created today, updated today, or has pending items and was updated recently
      const createdStr = card.createdAt ? new Date(card.createdAt).toISOString().split('T')[0] : '';
      const updatedStr = card.updatedAt ? new Date(card.updatedAt).toISOString().split('T')[0] : '';
      
      // If it's a completely old card (not updated today) AND all items are done, skip it.
      // Actually, user said: "หากไม่มีงาน หรืออยู่คนละวันจะไม่ส่งซ้ำแล้วนะ"
      // Let's strictly only include cards updated TODAY or created TODAY.
      return createdStr === todayStr || updatedStr === todayStr;
    });

    if (activeCards.length === 0) {
       console.log('[CRON] No active tasks for today. Skipping daily summary.');
       return res.status(200).json({ success: true, message: 'No tasks today, skipped.' });
    }
    
    // 1. Send the intro message only if there are active tasks today
    await discordService.sendNightlyReminder();
    
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
