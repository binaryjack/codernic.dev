import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log(`[BROWSER ERROR] ${error.message}`));

  console.log('Navigating to http://localhost:5173 ...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
  } catch(e) {
    console.error('Failed to load page:', e.message);
  }

  console.log('Waiting for UI to settle...');
  await page.waitForTimeout(5000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('\n--- DOM TEXT DUMP ---');
  console.log(text.substring(0, 2000));
  console.log('---------------------\n');

  // Let's try to find the select button and check options
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
  console.log('Buttons:', buttons);

  await browser.close();
})();
