// Dump TOP page (id=7) editor content + check what SEO plugin is active.
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// Fetch TOP raw content via REST
await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);
console.log('nonce:', nonce?.slice(0,12), '...');

const resp = await page.evaluate(async (nc) => {
  const r = await fetch('https://styleoftokyo.jp/wp-json/wp/v2/pages/7?context=edit', {
    credentials: 'include',
    headers: { 'X-WP-Nonce': nc },
  });
  return { status: r.status, text: await r.text() };
}, nonce);
console.log('TOP status:', resp.status, 'len:', resp.text.length);
const j = JSON.parse(resp.text);
const raw = j.content?.raw;
console.log('TOP content length:', raw?.length);
await fs.writeFile(path.join(BACKUP_DIR, 'top-editor-content.txt'), raw || '');
await fs.writeFile(path.join(BACKUP_DIR, 'top-editor-meta.json'), JSON.stringify({
  id: 7, slug: 'top', title: j.title?.rendered, status: j.status, modified: j.modified,
}, null, 2));
console.log('saved top-editor-content.txt');

// Also save public HTML of TOP
await page.goto('https://styleoftokyo.jp/', { waitUntil: 'networkidle' });
const publicHtml = await page.content();
await fs.writeFile(path.join(BACKUP_DIR, 'top-public.html'), publicHtml);
console.log('saved top-public.html (', publicHtml.length, 'bytes)');

await browser.close();
