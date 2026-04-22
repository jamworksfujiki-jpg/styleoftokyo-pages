// Find SEO SIMPLE PACK save button
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/admin.php?page=ssp_main_setting', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const buttons = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('input[type="submit"], button[type="submit"], button.button-primary'));
  return btns.map(b => ({
    tag: b.tagName.toLowerCase(),
    type: b.type,
    name: b.name,
    id: b.id,
    className: b.className,
    value: b.value,
    text: b.textContent?.trim().slice(0, 40),
  }));
});
console.log('Submit buttons:');
for (const b of buttons) console.log(` `, b);

await browser.close();
