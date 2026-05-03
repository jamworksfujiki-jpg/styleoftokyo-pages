import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.setViewportSize({ width: 1200, height: 180 });
await page.goto('file://' + path.join(__dirname, 'banner-source.html').replace(/\\/g, '/'));
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1200);
const el = await page.locator('.banner');
await el.screenshot({ path: path.join(__dirname, 'maedaoshi-banner.png'), omitBackground: false });
console.log('Banner saved: maedaoshi-banner.png');
await browser.close();
