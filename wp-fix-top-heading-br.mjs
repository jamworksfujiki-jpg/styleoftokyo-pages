// Replace [spbr] with <br> in the new TOP hero heading so it breaks on PC too.
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const ID = 7;

const FIND = '不動産の相談から意思決定まで、</span>[spbr]<span class="swl-fz u-fz-xl">すべてを整理する会社です。';
const REPLACE = '不動産の相談から意思決定まで、</span><br><span class="swl-fz u-fz-xl">すべてを整理する会社です。';

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);

console.log('[1] Fetch current TOP');
const fetched = await page.evaluate(async ({ id, nonce }) => {
  const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}?context=edit`, {
    credentials: 'include', headers: { 'X-WP-Nonce': nonce },
  });
  const j = await r.json();
  return { status: r.status, content: j.content?.raw };
}, { id: ID, nonce });
let content = fetched.content;
console.log(`   ${content.length} chars`);

await fs.writeFile(path.join(BACKUP_DIR, 'top-pre-heading-br-fix.txt'), content);

const count = content.split(FIND).length - 1;
console.log(`[2] Dry-run: ${count} match(es)`);
if (count !== 1) { console.log('   ❌ abort'); await browser.close(); process.exit(1); }

content = content.replace(FIND, REPLACE);

console.log('[3] PATCH');
const resp = await page.evaluate(async ({ id, content, nonce }) => {
  const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
    body: JSON.stringify({ content }),
  });
  return { status: r.status, text: await r.text() };
}, { id: ID, content, nonce });
console.log(`   status=${resp.status}`);
if (resp.status !== 200) { console.log(resp.text.slice(0, 300)); process.exit(1); }

console.log('[4] Verify on public URL');
await page.goto('https://styleoftokyo.jp/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const html = await page.content();
const ok = html.includes('不動産の相談から意思決定まで、</span><br><span') ||
           html.includes('不動産の相談から意思決定まで、</span><br/><span') ||
           html.includes('不動産の相談から意思決定まで、<br>');
console.log(`   <br> in heading: ${ok ? '✅' : '⚠️ check manually'}`);

await page.waitForTimeout(1500);
await browser.close();
