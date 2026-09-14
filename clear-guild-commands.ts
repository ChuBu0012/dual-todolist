const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

async function main() {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bot ${BOT_TOKEN}`,
  };

  // 1. Fetch guilds
  console.log('Fetching guilds...');
  const guildRes = await fetch('https://discord.com/api/v10/users/@me/guilds', { headers });
  if (!guildRes.ok) {
    console.error('Failed to fetch guilds', await guildRes.text());
    return;
  }
  const guilds = await guildRes.json();
  console.log(`Bot is in ${guilds.length} guilds.`);

  // 2. Loop and delete commands for each guild
  for (const guild of guilds) {
    console.log(`Checking commands for guild: ${guild.name} (${guild.id})`);
    const cmdUrl = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${guild.id}/commands`;
    const cmdRes = await fetch(cmdUrl, { headers });
    if (cmdRes.ok) {
      const cmds = await cmdRes.json();
      for (const cmd of cmds) {
        console.log(`  Deleting guild command: /${cmd.name} (${cmd.id})`);
        await fetch(`${cmdUrl}/${cmd.id}`, { method: 'DELETE', headers });
      }
    }
  }
  console.log('Done clearing guild commands!');
}
main();
