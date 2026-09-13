import { discordService } from '../../src/services/discordService';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Running 22:00 Daily Reminder...');
    
    // Check if there are active cards today
    const { firestoreService } = await import('../../src/services/firestoreService');
    const cards = await firestoreService.getAllCards();
    
    // Use ICT (Asia/Bangkok, UTC+7) to match card timestamps stored by browser
    const now = new Date();
    const todayStr = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const activeCards = cards.filter(card => {
      const createdStr = card.createdAt ? new Date(card.createdAt).toISOString().split('T')[0] : '';
      const updatedStr = card.updatedAt ? new Date(card.updatedAt).toISOString().split('T')[0] : '';
      return createdStr === todayStr || updatedStr === todayStr;
    });

    if (activeCards.length === 0) {
      console.log('[CRON] No active tasks for today. Skipping 22:00 reminder.');
      return res.status(200).json({ success: true, message: 'No tasks today, skipped.' });
    }

    await discordService.sendCheckinReminder();
    console.log('[CRON] Successfully sent 22:00 reminder');

    return res.status(200).json({ success: true, message: '22:00 reminder sent' });
  } catch (error: any) {
    console.error('[CRON] 22:00 reminder failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

