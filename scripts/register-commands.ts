const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error('❌ Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN in environment variables.');
  process.exit(1);
}

const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

const commandData = {
  name: 'todo',
  description: 'จัดการ Dual Todo ผ่าน Discord',
  description: 'เพิ่มงานใหม่แบบไวๆ (รองรับหลายรายการโดยใช้ , คั่น)',
  options: [
    {
      name: 'items',
      description: 'สิ่งที่ต้องทำ (เช่น: ซื้อนม, ล้างรถ, ซักผ้า)',
      type: 3, // STRING
      required: true,
    },
    {
      name: 'card',
      description: 'สร้างการ์ด (Card) ใหม่',
      type: 1, // SUB_COMMAND
      options: [
        {
          name: 'title',
          description: 'ชื่อการ์ดที่ต้องการสร้าง',
          type: 3, // STRING
          required: true,
        },
        {
          name: 'assign',
          description: 'มอบหมายให้ใคร (most, fern, both)',
          type: 3, // STRING
          required: false,
          choices: [
            { name: 'Most', value: 'most' },
            { name: 'Fern', value: 'fern' },
            { name: 'Both (ทุกคน)', value: 'both' },
          ],
        },
      ],
      description: 'ชื่อการ์ด (ไม่บังคับ - ถ้าไม่ใส่จะเข้าการ์ด Inbox)',
      type: 3, // STRING
      required: false,
    },
    {
      name: 'item',
      description: 'เพิ่มงานย่อย (Item) ลงในการ์ดที่มีอยู่',
      type: 1, // SUB_COMMAND
      options: [
        {
          name: 'name',
          description: 'ชื่องานที่ต้องทำ',
          type: 3, // STRING
          required: true,
        },
        {
          name: 'card',
          description: 'ชื่อการ์ดเป้าหมาย (พิมพ์แค่บางส่วนก็ได้)',
          type: 3, // STRING
          required: true,
        },
      name: 'assign',
      description: 'มอบหมายให้ใคร (most, fern, both)',
      type: 3, // STRING
      required: false,
      choices: [
        { name: 'Most', value: 'most' },
        { name: 'Fern', value: 'fern' },
        { name: 'Both (ทุกคน)', value: 'both' },
      ],
    },
  ],
};

async function main() {
  console.log('🔄 Registering Discord command...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${BOT_TOKEN}`,
    },
    body: JSON.stringify(commandData),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Successfully registered command: /${data.name}`);
  } else {
    const errorText = await response.text();
    console.error('❌ Failed to register command:', response.status, errorText);
  }
}

main().catch(console.error);
