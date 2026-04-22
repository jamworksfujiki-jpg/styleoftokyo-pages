// Retry concept with longer wait
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

const url = `https://styleoftokyo.jp/wp-admin/post.php?post=222&action=edit`;
await page.goto(url, { waitUntil: 'networkidle' });
// Wait for editor block content to actually appear in wp.data
await page.waitForFunction(() => {
  const c = window.wp?.data?.select('core/editor')?.getEditedPostAttribute('content');
  return typeof c === 'string' && c.length > 100;
}, { timeout: 60000 });

const data = await page.evaluate(() => {
  const s = window.wp.data.select('core/editor');
  return {
    title: s.getEditedPostAttribute('title'),
    excerpt: s.getEditedPostAttribute('excerpt'),
    status: s.getEditedPostAttribute('status'),
    content: s.getEditedPostAttribute('content'),
    nonce: window.wpApiSettings?.nonce,
  };
});

console.log(`title=${data.title}  status=${data.status}  content_length=${data.content?.length}`);
await fs.writeFile(path.join(BACKUP_DIR, `concept-editor-content.txt`), data.content || '');
await fs.writeFile(path.join(BACKUP_DIR, `concept-editor-meta.json`), JSON.stringify({
  id: 222, slug: 'concept', title: data.title, status: data.status, excerpt: data.excerpt, nonce_sample: data.nonce?.slice(0,8),
}, null, 2));
console.log('saved concept-editor-content.txt');

await browser.close();
