import { firestoreService } from '../../src/services/firestoreService';
import { discordService } from '../../src/services/discordService';

export default async function handler(_req: any, res: any) {
  try {
    console.log('[CRON] Running 30-minute batch completions cron...');
    const unnotifiedTasks = await firestoreService.getUnnotifiedCompletedTasks();
    console.log(`[CRON] Found ${unnotifiedTasks.length} unnotified tasks.`);

    if (unnotifiedTasks.length > 0) {
      await discordService.sendBatchedCompletions(unnotifiedTasks);
      await firestoreService.markCompletedTasksAsNotified(unnotifiedTasks.map((t) => t.id));
      console.log(`[CRON] Sent ${unnotifiedTasks.length} tasks and marked as notified.`);
    }

    const result = {
      success: true,
      processed: unnotifiedTasks.length,
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
    console.error('[CRON] Error in batch-completions cron:', error);
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
