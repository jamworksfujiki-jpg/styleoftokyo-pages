// Check if ssp_meta_description is exposed via REST API for pages
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);

const pages = [7, 222, 239, 242];
for (const id of pages) {
  const resp = await page.evaluate(async ({ id, nonce }) => {
    const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}?context=edit`, {
      credentials: 'include',
      headers: { 'X-WP-Nonce': nonce },
    });
    return { status: r.status, text: await r.text() };
  }, { id, nonce });
  if (resp.status !== 200) { console.log(`id=${id} status=${resp.status}`); continue; }
  const j = JSON.parse(resp.text);
  console.log(`id=${id} slug=${j.slug}`);
  console.log(`  meta keys: ${Object.keys(j.meta || {}).join(', ') || '(none)'}`);
  if (j.meta) {
    for (const [k, v] of Object.entries(j.meta)) {
      const s = typeof v === 'string' ? v.slice(0, 80) : JSON.stringify(v).slice(0,80);
      console.log(`  ${k}: ${s}`);
    }
  }
}

await browser.close();
