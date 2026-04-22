// Find SEO SIMPLE PACK admin slug by scanning admin menu
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// Dump left admin menu with hrefs containing 'ssp' or 'seo'
const links = await page.evaluate(() => {
  const a = Array.from(document.querySelectorAll('#adminmenu a'));
  return a.map(x => ({ href: x.href, text: x.textContent.trim() }))
    .filter(x => /ssp|seo|simple/i.test(x.href + ' ' + x.text));
});
console.log('SEO-related admin menu items:');
for (const l of links) console.log(`  ${l.text.slice(0,40)}  ->  ${l.href}`);

await browser.close();
