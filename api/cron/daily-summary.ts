import { firestoreService } from '../../src/services/firestoreService';
import { discordService } from '../../src/services/discordService';

export default async function handler(_req: any, res: any) {
  try {
    console.log('[CRON] Running 22:00 Daily Summary & Check-in cron...');

    // 1. Send the 22:00 Check-in message ("มี todo อะไรจะจดไหมม")
    await discordService.sendNightlyReminder();

    // 2. Fetch all cards and calculate stats for Dual Todo Summary
    const cards = await firestoreService.getAllCards();

    let totalItems = 0;
    let completedCount = 0;
    let mostCompletedCount = 0;
    let fernCompletedCount = 0;
    const pendingByCard: Array<{ cardTitle: string; items: Array<{ text: string; assignee: string }> }> = [];

    cards.forEach((card) => {
      const pendingItems: Array<{ text: string; assignee: string }> = [];

      (card.items || []).forEach((item) => {
        totalItems++;
        if (item.isDone) {
          completedCount++;
          if (item.completedBy === 'most') {
            mostCompletedCount++;
          } else if (item.completedBy === 'fern') {
            fernCompletedCount++;
          }
        } else {
          pendingItems.push({
            text: item.text,
            assignee: card.assignee,
          });
        }
      });

      if (pendingItems.length > 0) {
        pendingByCard.push({
          cardTitle: card.title,
          items: pendingItems,
        });
      }
    });

    const pendingCount = totalItems - completedCount;

    // 3. Send formatted summary (automatically chunks into multiple messages if too long)
    await discordService.sendDailySummaryFormatted({
      date: new Date(),
      totalItems,
      completedCount,
      pendingCount,
      mostCompletedCount,
      fernCompletedCount,
      pendingByCard,
    });

    const result = {
      success: true,
      summary: {
        totalItems,
        completedCount,
        pendingCount,
        mostCompletedCount,
        fernCompletedCount,
      },
      timestamp: new Date().toISOString(),
    };

    if (res && typeof res.status === 'function') {
      return res.status(200).json(result);
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[CRON] Error in daily-summary cron:', error);
    const errResult = { success: false, error: error?.message || String(error) };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errResult);
    }
    return new Response(JSON.stringify(errResult), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
