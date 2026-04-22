// Dump raw block content from each page's admin edit view (Gutenberg code editor).
// Saves: {slug}-editor-content.txt  (raw block markup, for backup + edit source)
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const TARGETS = [
  { slug: 'concept', id: 222 },
  { slug: 'about', id: 239 },
  { slug: 'service', id: 242 },
];

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

for (const { slug, id } of TARGETS) {
  console.log(`\n=== ${slug} (id=${id}) ===`);
  const url = `https://styleoftokyo.jp/wp-admin/post.php?post=${id}&action=edit`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Wait for block editor to finish initializing
  await page.waitForTimeout(5000);

  // Extract nonce and raw content via wp.data
  const data = await page.evaluate(() => {
    try {
      const content = window.wp?.data?.select('core/editor')?.getEditedPostAttribute('content');
      const title = window.wp?.data?.select('core/editor')?.getEditedPostAttribute('title');
      const excerpt = window.wp?.data?.select('core/editor')?.getEditedPostAttribute('excerpt');
      const status = window.wp?.data?.select('core/editor')?.getEditedPostAttribute('status');
      const nonce = window.wpApiSettings?.nonce;
      return { ok: true, title, excerpt, status, content_length: content?.length, content, nonce };
    } catch (e) {
      return { ok: false, err: String(e) };
    }
  });

  if (!data.ok) {
    console.log('  FAILED:', data.err);
    continue;
  }
  console.log(`  title=${data.title}  status=${data.status}  content_length=${data.content_length}  nonce=${data.nonce?.slice(0,8)}...`);
  await fs.writeFile(path.join(BACKUP_DIR, `${slug}-editor-content.txt`), data.content || '');
  await fs.writeFile(path.join(BACKUP_DIR, `${slug}-editor-meta.json`), JSON.stringify({
    id, slug, title: data.title, status: data.status, excerpt: data.excerpt, nonce_sample: data.nonce?.slice(0,8),
  }, null, 2));
  console.log(`  saved ${slug}-editor-content.txt`);
}

await browser.close();
console.log('\nDone.');
