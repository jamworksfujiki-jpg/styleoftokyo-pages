// Apply edits to WordPress pages via REST API PATCH with X-WP-Nonce.
// Requires wp-storage.json (from wp-login.mjs) and wp-backup/2026-04-22/proposed/*.txt (from wp-dryrun.mjs).
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EDITS } from './wp-edits.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');
const PROPOSED_DIR = path.join(BACKUP_DIR, 'proposed');

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

console.log('[1/3] Load wp-admin for fresh nonce');
await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);
console.log('  nonce:', nonce?.slice(0, 12), '...');
if (!nonce) {
  console.error('No nonce. Re-login required.');
  await browser.close();
  process.exit(1);
}

const results = [];
for (const [slug, { id }] of Object.entries(EDITS)) {
  console.log(`\n[2/3] PATCH ${slug} (id=${id})`);
  const proposed = await fs.readFile(path.join(PROPOSED_DIR, `${slug}.txt`), 'utf8');

  const resp = await page.evaluate(async ({ id, content, nonce }) => {
    const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
      },
      body: JSON.stringify({ content }),
    });
    return { status: r.status, text: await r.text() };
  }, { id, content: proposed, nonce });

  if (resp.status === 200) {
    const j = JSON.parse(resp.text);
    console.log(`  ✅ updated. modified=${j.modified}  new_content_length=${j.content?.raw?.length || j.content?.rendered?.length}`);
    results.push({ slug, id, status: 'ok', modified: j.modified });
  } else {
    console.log(`  ❌ FAILED status=${resp.status}`);
    console.log(`     body: ${resp.text.slice(0, 400)}`);
    results.push({ slug, id, status: 'fail', http_status: resp.status, body: resp.text.slice(0, 400) });
  }
}

console.log('\n[3/3] Verify by fetching public URLs');
for (const { slug, id, status } of results) {
  if (status !== 'ok') continue;
  const url = `https://styleoftokyo.jp/${slug}/`;
  const resp = await page.goto(url, { waitUntil: 'networkidle' });
  const html = await page.content();
  await fs.writeFile(path.join(BACKUP_DIR, `${slug}-public-after.html`), html);
  console.log(`  saved ${slug}-public-after.html (${html.length} bytes)`);
}

await fs.writeFile(path.join(BACKUP_DIR, 'apply-results.json'), JSON.stringify({
  timestamp: new Date().toISOString(),
  results,
}, null, 2));

console.log('\nDone. Results saved to apply-results.json');
await page.waitForTimeout(3000);
await browser.close();
