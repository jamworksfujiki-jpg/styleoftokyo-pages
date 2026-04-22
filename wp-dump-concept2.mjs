// Fetch concept raw content via REST API with X-WP-Nonce
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

// Go to a lightweight admin page just to get nonce
console.log('[1] Load admin dashboard for nonce');
await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);
console.log('nonce:', nonce?.slice(0,8), '...');
if (!nonce) { console.error('No nonce found'); process.exit(1); }

// Fetch concept via REST context=edit with nonce header
console.log('[2] Fetch concept via REST (context=edit)');
const resp = await page.evaluate(async (nc) => {
  const r = await fetch('https://styleoftokyo.jp/wp-json/wp/v2/pages/222?context=edit', {
    credentials: 'include',
    headers: { 'X-WP-Nonce': nc },
  });
  return { status: r.status, text: await r.text() };
}, nonce);
console.log('status:', resp.status, 'len:', resp.text.length);

if (resp.status === 200) {
  const j = JSON.parse(resp.text);
  const raw = j.content?.raw;
  await fs.writeFile(path.join(BACKUP_DIR, 'concept-editor-content.txt'), raw || '');
  await fs.writeFile(path.join(BACKUP_DIR, 'concept-editor-meta.json'), JSON.stringify({
    id: 222, slug: 'concept', title: j.title?.rendered, status: j.status, modified: j.modified, content_length: raw?.length,
  }, null, 2));
  console.log('saved concept-editor-content.txt, len=', raw?.length);
} else {
  console.log('ERR body:', resp.text.slice(0, 300));
}

await browser.close();
