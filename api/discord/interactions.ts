import type { VercelRequest, VercelResponse } from '@vercel/node';
import nacl from 'tweetnacl';
import { randomUUID } from 'crypto';
import { firestoreService } from '../../src/services/firestoreService.js';
import type { TodoAssignee } from '../../src/types/todo.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validate Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Verify Discord Signature
  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;
  
  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error('DISCORD_PUBLIC_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const rawBody = await getRawBody(req);
    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + rawBody),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    );

    if (!isVerified) {
      return res.status(401).json({ error: 'Invalid request signature' });
    }

    // 3. Parse Payload
    const payload = JSON.parse(rawBody);

    // 4. Handle PING (Type 1)
    if (payload.type === 1) {
      return res.status(200).json({ type: 1 });
    }

    // 5. Handle Application Commands (Type 2)
    if (payload.type === 2) {
      const { data, member, user } = payload;
      
      // Determine user id (could be in member.user.id or user.id depending on where command is used)
      const discordUserId = member?.user?.id || user?.id;
      
      let defaultAssignee: TodoAssignee = 'both';
      if (discordUserId === process.env.DISCORD_MOST_ID) defaultAssignee = 'most';
      else if (discordUserId === process.env.DISCORD_FERN_ID) defaultAssignee = 'fern';

      if (data.name === 'todo') {
        const itemsOpt = data.options?.find((o: any) => o.name === 'items');
        const cardOpt = data.options?.find((o: any) => o.name === 'card');
        const assignOpt = data.options?.find((o: any) => o.name === 'assign');

        const rawItemsString = itemsOpt?.value || '';
        const cardSearch = cardOpt?.value || 'Inbox';
        const assign = (assignOpt?.value as TodoAssignee) || defaultAssignee;

        const itemNames = rawItemsString
          .split(',')
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 0);

        if (itemNames.length === 0) {
          return respond(res, '❌ ไม่พบชื่อรายการที่ต้องการเพิ่ม');
        }

        const cards = await firestoreService.getAllCards();
        let targetCard = cards.find(c => 
          c.title.toLowerCase().includes(cardSearch.toLowerCase())
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
          return respond(res, `✅ สร้างการ์ด **${cardSearch}** และเพิ่ม ${newItems.length} งานให้แล้ว!`);
        } else {
          const updatedItems = [...(targetCard.items || []), ...newItems];
          await firestoreService.updateCard(targetCard.id, {
            items: updatedItems
          });
          return respond(res, `✅ เพิ่ม ${newItems.length} งาน ลงในการ์ด **${targetCard.title}** เรียบร้อย!`);
        }
      }
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (error) {
    console.error('Error handling interaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper to send Discord messages back
function respond(res: VercelResponse, content: string) {
  return res.status(200).json({
    type: 4, // ChannelMessageWithSource
    data: {
      content
    }
  });
}

async function getRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
