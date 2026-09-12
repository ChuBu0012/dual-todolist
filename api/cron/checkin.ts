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
    await discordService.sendCheckinReminder();
    console.log('[CRON] Successfully sent 22:00 reminder');

    return res.status(200).json({ success: true, message: '22:00 reminder sent' });
  } catch (error: any) {
    console.error('[CRON] 22:00 reminder failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

