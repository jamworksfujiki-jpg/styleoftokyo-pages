// Replace TOP page hero section (heading + lead + sublead) with the new docx text.
// Strategy:
//   1. Fetch current TOP content fresh via REST (context=edit, nonce auth).
//   2. Save snapshot to wp-backup/.../top-editor-content-pre-hero.txt for rollback.
//   3. Dry-run: each find string must match exactly once.
//   4. Apply find/replace.
//   5. PATCH back via REST.
//   6. Verify by fetching live page text.

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const ID = 7; // TOP page

const EDITS = [
  {
    name: 'TOP-hero-1 heading',
    find: '「タイパ·コスパ良く</span>[spbr]<span class="swl-fz u-fz-xl">住まいを取得しましょう。」',
    replace: '不動産の相談から意思決定まで、</span>[spbr]<span class="swl-fz u-fz-xl">すべてを整理する会社です。',
  },
  {
    name: 'TOP-hero-2 lead paragraph',
    find: '住宅購入は大きな買い物です。しかし、十分な判断材料がないまま契約を進めてしまうケースが多く、[pcbr]結果として、理想とはかけ離れた家づくりになる事も。',
    replace: 'スタイルオブ東京は、[pcbr]不動産の購入・売却・住み替え・相続・建築など、[pcbr]あらゆる不動産の相談を整理し、判断をサポートするエージェントです。<br><br>不動産は、何から始めればいいのか分からないまま進めてしまい、[pcbr]後から後悔するケースも少なくありません。',
  },
  {
    name: 'TOP-hero-3 sublead paragraph',
    find: '<strong>私たちスタイルオブ東京は、住宅購入における伴走のプロとして、</strong>[pcbr]<strong>お客様の望む「楽しく暮らせる形」の整理から不動産·建築会社·住宅ローン·不動産売買に</strong>[pcbr]<strong>必要なすべてを、お客様に合うベストな形で提供いたします。</strong>',
    replace: '<strong>私たちは、お客様の状況や目的を整理し、</strong>[pcbr]<strong>中立の立場で最適な選択をご提案します。</strong><br><br><strong>まずは、今の状況を整理することから始めてみませんか。</strong>',
  },
];

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

console.log('[1] Open admin to grab nonce');
await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);
console.log('   nonce:', nonce?.slice(0, 12), '...');

console.log('[2] Fetch current TOP content (REST context=edit)');
const fetched = await page.evaluate(async ({ id, nonce }) => {
  const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}?context=edit`, {
    credentials: 'include', headers: { 'X-WP-Nonce': nonce },
  });
  const j = await r.json();
  return { status: r.status, content: j.content?.raw, title: j.title?.raw };
}, { id: ID, nonce });

if (fetched.status !== 200 || !fetched.content) {
  console.log('   ❌ fetch failed', fetched.status);
  process.exit(1);
}
let content = fetched.content;
console.log(`   fetched ${content.length} chars`);

// Backup
const preFile = path.join(BACKUP_DIR, 'top-editor-content-pre-hero.txt');
await fs.writeFile(preFile, content);
console.log(`   backup -> ${preFile}`);

console.log('[3] Dry-run');
let ok = true;
for (const e of EDITS) {
  const count = content.split(e.find).length - 1;
  if (count === 1) console.log(`   ✅ ${e.name} (1 match)`);
  else { console.log(`   ❌ ${e.name}: ${count} matches`); ok = false; }
}
if (!ok) {
  console.log('Dry-run failed. Abort.');
  await browser.close();
  process.exit(1);
}

console.log('[4] Apply replacements');
for (const e of EDITS) content = content.replace(e.find, e.replace);
const postFile = path.join(BACKUP_DIR, 'top-editor-content-post-hero.txt');
await fs.writeFile(postFile, content);
console.log(`   proposed -> ${postFile}, len=${content.length}`);

console.log('[5] PATCH back via REST');
const resp = await page.evaluate(async ({ id, content, nonce }) => {
  const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages/${id}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
    body: JSON.stringify({ content }),
  });
  return { status: r.status, text: await r.text() };
}, { id: ID, content, nonce });
if (resp.status === 200) {
  const j = JSON.parse(resp.text);
  console.log(`   ✅ TOP updated. modified=${j.modified}`);
} else {
  console.log(`   ❌ FAILED status=${resp.status}`);
  console.log(resp.text.slice(0, 400));
  process.exit(1);
}

console.log('[6] Verify on public URL');
await page.goto('https://styleoftokyo.jp/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const visible = await page.evaluate(() => document.body.innerText);
const checks = [
  ['不動産の相談から意思決定まで', true],
  ['すべてを整理する会社です', true],
  ['判断をサポートするエージェント', true],
  ['今の状況を整理することから始めてみませんか', true],
  ['タイパ·コスパ良く', false],
  ['住宅購入は大きな買い物です', false],
  ['住宅購入における伴走のプロとして', false],
];
for (const [needle, shouldExist] of checks) {
  const found = visible.includes(needle);
  const sym = (found === shouldExist) ? '✅' : '❌';
  console.log(`   ${sym} ${shouldExist ? 'present' : 'gone'}: "${needle}"`);
}

await page.waitForTimeout(1500);
await browser.close();
console.log('\nDone.');
