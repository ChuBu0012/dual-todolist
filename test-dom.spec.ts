import { test, expect } from '@playwright/test';

test('print dom', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  if (await page.isVisible('text=LOGIN')) {
    await page.fill('input[type="password"]', '11032005');
    await page.click('text=LOGIN');
    await page.waitForTimeout(3000);
  }
  
  const html = await page.content();
  console.log(html);
});
