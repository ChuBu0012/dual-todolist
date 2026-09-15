import { firestoreService } from '../src/services/firestoreService.js';
import { formatThaiDate } from '../src/utils/dateFormat.js';

async function migrateInbox() {
  console.log('Fetching cards...');
  const cards = await firestoreService.getAllCards();
  
  const inboxCard = cards.find(c => c.title.toLowerCase() === 'inbox');
  if (!inboxCard) {
    console.log('No Inbox card found. Nothing to migrate.');
    process.exit(0);
  }

  console.log(`Found Inbox card with ID: ${inboxCard.id}`);
  const items = inboxCard.items || [];
  
  if (items.length > 0) {
    console.log(`Inbox has ${items.length} items. Moving them to Today's card...`);
    const todayTitle = formatThaiDate(new Date());
    let targetCard = cards.find(c => c.title.toLowerCase() === todayTitle.toLowerCase());
    
    if (targetCard) {
      console.log(`Target card "${todayTitle}" exists. Appending items...`);
      const updatedItems = [...(targetCard.items || []), ...items];
      await firestoreService.updateCard(targetCard.id, { items: updatedItems });
    } else {
      console.log(`Target card "${todayTitle}" does not exist. Creating it...`);
      await firestoreService.createCard({
        title: todayTitle,
        assignee: 'both',
        items: items
      });
    }
  } else {
    console.log('Inbox is empty. No items to move.');
  }

  console.log('Deleting Inbox card...');
  await firestoreService.deleteCard(inboxCard.id);
  console.log('Migration complete!');
  process.exit(0);
}

migrateInbox().catch(e => {
  console.error(e);
  process.exit(1);
});
