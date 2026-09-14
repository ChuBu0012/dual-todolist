
const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error('❌ Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN in environment variables.');
  process.exit(1);
}

const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

const commandData = {
  name: 'todo',
  description: 'เพิ่มงานใหม่ลงใน Dual Todo (ใส่ได้หลายงานโดยคั่นด้วยเครื่องหมายจุลภาค ,)',
  options: [
    {
      name: 'items',
      description: 'สิ่งที่ต้องทำ เช่น: ซื้อนม, ล้างรถ, กวาดห้อง',
      type: 3, // STRING
      required: true,
    },
    {
      name: 'card',
      description: 'ชื่อการ์ดที่ต้องการใส่ (ไม่ระบุ = ใส่ลงการ์ด Inbox)',
      type: 3, // STRING
      required: false,
    },
    {
      name: 'assign',
      description: 'มอบหมายให้ใคร (ไม่ระบุ = ผู้พิมพ์คำสั่งเป็นเจ้าของ)',
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
