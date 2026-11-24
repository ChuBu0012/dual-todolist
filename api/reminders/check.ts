import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection, getDocs } from 'firebase/firestore';
import db from '../../src/config/firebase.js';
import { firestoreService } from '../../src/services/firestoreService.js';
import { discordService } from '../../src/services/discordService.js';
import { evaluateReminder } from '../../src/utils/reminderUtils.js';
import type { CardItem, TodoAssignee } from '../../src/types/todo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow POST (and GET for healthcheck/curl convenience if authorized)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Check CRON_SECRET if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.query.secret as string | undefined);

    if (providedSecret !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const now = new Date();
    const todosRef = collection(db, 'todos');
    const snapshot = await getDocs(todosRef);

    let remindersSent = 0;

    for (const docSnap of snapshot.docs) {
      const card = { id: docSnap.id, ...docSnap.data() } as CardItem;
      if (card.isArchived) continue;
      if (!card.items || card.items.length === 0) continue;

      let cardModified = false;
      const updatedItems = [...card.items];
      const remindersToDispatch: Array<{
        title: string;
        text: string;
        assignee: TodoAssignee;
        action: 'soon' | 'due';
      }> = [];

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        if (item.isDone) continue;

        const evalResult = evaluateReminder(item, now);
        if (evalResult.action) {
          cardModified = true;

          updatedItems[i] = {
            ...item,
            reminded_time: evalResult.timeStr,
            reminded_soon: evalResult.action === 'soon' ? true : item.reminded_soon,
            reminded_due: evalResult.action === 'due' ? true : item.reminded_due,
          };

          remindersToDispatch.push({
            title: card.title,
            text: item.text,
            assignee: card.assignee || 'both',
            action: evalResult.action,
          });
        }
      }

      if (cardModified) {
        // Write status to Firestore first to avoid duplicate sends if update fails
        await firestoreService.updateCard(card.id, { items: updatedItems });

        // Dispatch Discord notifications only after Firestore update succeeds
        for (const reminder of remindersToDispatch) {
          try {
            await discordService.sendTaskReminder(
              reminder.title,
              reminder.text,
              reminder.assignee,
              reminder.action
            );
            remindersSent++;
          } catch (discordError) {
            console.error('Failed to send Discord reminder:', discordError);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      checkedCards: snapshot.size,
      remindersSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error checking reminders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
