import { test, expect } from '@playwright/test';

test('drag and drop reorders items', async ({ page }) => {
  page.on('console', msg => {
    if (msg.text().includes('DRAG_END')) {
      console.log('BROWSER:', msg.text());
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  if (await page.isVisible('text=LOGIN')) {
    await page.fill('input[type="password"]', '11032005');
    await page.click('text=LOGIN');
    await page.waitForTimeout(3000);
  }
  
  const handles = page.locator('div[role="button"][aria-roledescription="sortable"]');
  const source = handles.nth(0);
  const target = handles.nth(1);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  
  await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 });
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.waitForTimeout(1000);
});
