import type { VercelRequest, VercelResponse } from '@vercel/node';
import nacl from 'tweetnacl';
import { randomUUID } from 'crypto';
import { waitUntil } from '@vercel/functions';
import { firestoreService } from '../../src/services/firestoreService.js';
import { formatThaiDate } from '../../src/utils/dateFormat.js';
import type { TodoAssignee } from '../../src/types/todo.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;
  
  if (!signature || !timestamp) return res.status(401).json({ error: 'Missing signature' });

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) return res.status(500).json({ error: 'Server configuration error' });

  try {
    const rawBody = await getRawBody(req);
    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + rawBody),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    );

    if (!isVerified) return res.status(401).json({ error: 'Invalid request signature' });

    const payload = JSON.parse(rawBody);

    if (payload.type === 1) return res.status(200).json({ type: 1 });

    if (payload.type === 2) {
      if (['todo', 'daily', 'next'].includes(payload.data.name)) {
        // Use waitUntil to do the work in the background so we can respond instantly
        waitUntil(processTodoCommand(payload));

        // Immediately respond with DEFERRED (type 5) to prevent Discord's 3s timeout
        return res.status(200).json({ type: 5 });
      }
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (error) {
    console.error('Error handling interaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function processTodoCommand(payload: any) {
  try {
    const { data, member, user, token } = payload;
    const appId = process.env.DISCORD_APP_ID;
    const discordUserId = member?.user?.id || user?.id;
    const commandName = data.name; // 'todo', 'daily', or 'next'
    
    let defaultAssignee: TodoAssignee = 'both';
    if (discordUserId === process.env.DISCORD_MOST_ID) defaultAssignee = 'most';
    else if (discordUserId === process.env.DISCORD_FERN_ID) defaultAssignee = 'fern';

    const itemsOpt = data.options?.find((o: any) => o.name === 'items');
    const assignOpt = data.options?.find((o: any) => o.name === 'assign');
    const rawItemsString = itemsOpt?.value || '';
    const assign = (assignOpt?.value as TodoAssignee) || defaultAssignee;

    let cardSearch = formatThaiDate(new Date());

    if (commandName === 'todo') {
      const cardOpt = data.options?.find((o: any) => o.name === 'card');
      cardSearch = cardOpt?.value || formatThaiDate(new Date());
    } else if (commandName === 'daily') {
      cardSearch = formatThaiDate(new Date());
    } else if (commandName === 'next') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      cardSearch = formatThaiDate(tomorrow);
    }

    const itemNames = rawItemsString
      .split(',')
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 0);

    if (itemNames.length === 0) {
      await sendFollowUp(appId!, token, '❌ ไม่พบชื่อรายการที่ต้องการเพิ่ม');
      return;
    }

    const cards = await firestoreService.getAllCards();
    let targetCard = cards.find(c => 
      c.title.toLowerCase().includes(cardSearch.toLowerCase()) &&
      (c.assignee === assign || c.assignee === 'both')
    );

    const newItems = itemNames.map((text: string) => ({
      id: randomUUID(),
      text,
      isDone: false,
    }));

    if (!targetCard) {
      await firestoreService.createCard({
        title: cardSearch,
        assignee: assign,
        items: newItems
      });
      await sendFollowUp(appId!, token, `✅ สร้างการ์ด **${cardSearch}** และเพิ่ม ${newItems.length} งานให้แล้ว!`);
    } else {
      const updatedItems = [...(targetCard.items || []), ...newItems];
      await firestoreService.updateCard(targetCard.id, {
        items: updatedItems
      });
      await sendFollowUp(appId!, token, `✅ เพิ่ม ${newItems.length} งาน ลงในการ์ด **${targetCard.title}** เรียบร้อย!`);
    }
  } catch (e) {
    console.error('Error processing todo command:', e);
    const { token } = payload;
    const appId = process.env.DISCORD_APP_ID;
    if (appId && token) {
      await sendFollowUp(appId, token, '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลครับ');
    }
  }
}

async function sendFollowUp(appId: string, token: string, content: string) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
}

async function getRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
