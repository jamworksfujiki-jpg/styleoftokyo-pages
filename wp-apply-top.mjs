// Apply TOP-only edits (5 cards per docx §4)
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EDITS } from './wp-edits.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');
const PROPOSED_DIR = path.join(BACKUP_DIR, 'proposed');
await fs.mkdir(PROPOSED_DIR, { recursive: true });

const { id, edits } = EDITS.top;
console.log(`Dry-run TOP (id=${id})`);
let content = await fs.readFile(path.join(BACKUP_DIR, 'top-editor-content.txt'), 'utf8');
let ok = true;
for (const edit of edits) {
  const count = content.split(edit.find).length - 1;
  if (count === 1) {
    console.log(`  ✅ ${edit.name}`);
    content = content.replace(edit.find, edit.replace);
  } else {
    console.log(`  ❌ ${edit.name}: ${count} matches (expected 1)`);
    console.log(`     find(100): ${edit.find.slice(0,100)}`);
    ok = false;
  }
}
if (!ok) { console.log('\nDry-run failed. Abort.'); process.exit(1); }
await fs.writeFile(path.join(PROPOSED_DIR, 'top.txt'), content);
console.log('  proposed/top.txt written, len=', content.length);

// Apply via REST
const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);
console.log('\nnonce:', nonce?.slice(0,12), '...');

const resp = await page.evaluate(async ({ id, content, nonce }) => {
  const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
    body: JSON.stringify({ content }),
  });
  return { status: r.status, text: await r.text() };
}, { id, content, nonce });

if (resp.status === 200) {
  const j = JSON.parse(resp.text);
  console.log(`✅ TOP updated. modified=${j.modified}`);
} else {
  console.log(`❌ FAILED status=${resp.status}`);
  console.log(resp.text.slice(0, 400));
  process.exit(1);
}

// Verify
await page.goto('https://styleoftokyo.jp/', { waitUntil: 'networkidle' });
const html = await page.content();
await fs.writeFile(path.join(BACKUP_DIR, 'top-public-after.html'), html);
console.log('saved top-public-after.html');

await page.waitForTimeout(2000);
await browser.close();
