import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto('file://' + path.join(__dirname, 'og-source.html').replace(/\\/g, '/'));
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
await page.screenshot({
  path: path.join(__dirname, 'og-default.png'),
  clip: { x: 0, y: 0, width: 1200, height: 630 },
  omitBackground: false
});
console.log('OGP saved: og-default.png (1200x630)');
await browser.close();
