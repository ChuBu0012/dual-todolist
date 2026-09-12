import { test, expect } from '@playwright/test';

test('take screenshot', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  if (await page.isVisible('text=LOGIN')) {
    await page.fill('input[type="password"]', '11032005');
    await page.click('text=LOGIN');
    await page.waitForTimeout(3000);
  }
  
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Saved screenshot.png');
});
