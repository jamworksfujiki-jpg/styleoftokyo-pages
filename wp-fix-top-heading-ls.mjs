// Widen letter-spacing on TOP hero heading (was -3px, too tight).
// Target only the hero heading by anchoring on the new text "不動産の相談から意思決定まで".
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const ID = 7;

// Two edits: JSON block attr + HTML style attr (both in the same heading)
const EDITS = [
  {
    name: 'block JSON letterSpacing',
    find: '{"textAlign":"center","className":"is-style-section_ttl u-mb-ctrl u-mb-10","style":{"typography":{"letterSpacing":"-3px"}}} -->\n<h2 class="wp-block-heading has-text-align-center is-style-section_ttl u-mb-ctrl u-mb-10" style="letter-spacing:-3px"><span class="swl-fz u-fz-xl"><small class="mininote"></small><br>不動産の相談から意思決定まで、',
    replace: '{"textAlign":"center","className":"is-style-section_ttl u-mb-ctrl u-mb-10","style":{"typography":{"letterSpacing":"0.05em"}}} -->\n<h2 class="wp-block-heading has-text-align-center is-style-section_ttl u-mb-ctrl u-mb-10" style="letter-spacing:0.05em"><span class="swl-fz u-fz-xl"><small class="mininote"></small><br>不動産の相談から意思決定まで、',
  },
];

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);

console.log('[1] Fetch TOP');
const fetched = await page.evaluate(async ({ id, nonce }) => {
  const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}?context=edit`, {
    credentials: 'include', headers: { 'X-WP-Nonce': nonce },
  });
  const j = await r.json();
  return { status: r.status, content: j.content?.raw };
}, { id: ID, nonce });
let content = fetched.content;
console.log(`   ${content.length} chars`);

await fs.writeFile(path.join(BACKUP_DIR, 'top-pre-heading-ls.txt'), content);

console.log('[2] Dry-run');
let ok = true;
for (const e of EDITS) {
  const c = content.split(e.find).length - 1;
  console.log(`   ${c === 1 ? '✅' : '❌'} ${e.name}: ${c} match`);
  if (c !== 1) ok = false;
}
if (!ok) {
  // Try both \r\n and \n newline variants
  console.log('   trying CRLF variant...');
  for (const e of EDITS) {
    const crlfFind = e.find.replace(/\n/g, '\r\n');
    const c = content.split(crlfFind).length - 1;
    console.log(`   ${c === 1 ? '✅' : '❌'} ${e.name} (CRLF): ${c} match`);
    if (c === 1) { e.find = crlfFind; e.replace = e.replace.replace(/\n/g, '\r\n'); ok = true; }
  }
}
if (!ok) { console.log('abort'); await browser.close(); process.exit(1); }

for (const e of EDITS) content = content.replace(e.find, e.replace);

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

console.log('[4] Verify');
await page.goto('https://styleoftokyo.jp/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const html = await page.content();
console.log(`   letter-spacing:0.05em present: ${html.includes('letter-spacing:0.05em') ? '✅' : '⚠️'}`);
console.log(`   letter-spacing:-3px still present: ${html.includes('letter-spacing:-3px') ? '⚠️ yes' : '✅ no'}`);

await page.waitForTimeout(1500);
await browser.close();
