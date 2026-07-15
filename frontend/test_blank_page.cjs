const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173/activate-account?token=123', { waitUntil: 'networkidle' });
  
  const content = await page.content();
  console.log("Has root div?", content.includes('id="root"'));
  console.log("Is blank?", await page.evaluate(() => document.getElementById('root').innerHTML === ''));
  
  await browser.close();
})();
