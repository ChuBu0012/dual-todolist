import { discordService } from '../../src/services/discordService';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Basic security: check CRON_SECRET if environment variable is set
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Running 22:30 Daily Reminder...');
    await discordService.sendNightlyReminder();
    console.log('[CRON] Successfully sent 22:30 reminder');

    return res.status(200).json({ success: true, message: 'Nightly reminder sent' });
  } catch (error: any) {
    console.error('[CRON] Nightly reminder failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

