// Fill SEO SIMPLE PACK's ssp_meta_description for TOP/CONCEPT/ABOUT/SERVICE via UI automation.
// Content is unchanged — we only set the meta description field and click Update.
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const PAGES = [
  {
    id: 7, slug: 'top',
    description: 'スタイルオブ東京は、不動産の購入・売却・住み替え・相続・空き家・建築リフォームまで、あらゆる不動産のお悩みに中立の立場で対応する東京の不動産エージェント会社です。Zoom無料相談受付中。',
  },
  {
    id: 222, slug: 'concept',
    description: 'スタイルオブ東京は、住宅購入から売却・相続・家じまいまで、不動産のことなら何でも相談できる東京の不動産エージェントです。中立の立場でプロが伴走し、タイパ・コスパ良く不動産問題を解決します。',
  },
  {
    id: 239, slug: 'about',
    description: '初めての方でも安心。購入・売却・住み替え・相続・空き家など、不動産に関するどんなお悩みも、累計2,000件以上の相談実績を持つプロが丁寧にサポートします。まずはZoom無料相談から。',
  },
  {
    id: 242, slug: 'service',
    description: 'スタイルオブ東京のサービスは、不動産相談（Zoom無料）・住宅ローンサポート・物件内見同行・価格交渉・建築会社紹介・アフターサービスまでワンストップ。売却・相続・住み替えのご相談も受付中です。',
  },
];

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

const results = [];
for (const { id, slug, description } of PAGES) {
  console.log(`\n=== ${slug} (id=${id}) ===`);
  const url = `https://styleoftokyo.jp/wp-admin/post.php?post=${id}&action=edit`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  // Close welcome modal if present
  try {
    await page.click('button[aria-label="閉じる"]', { timeout: 2000 });
  } catch {}

  // Scroll to SEO SIMPLE PACK metabox — it usually has an H2 with "SEO SIMPLE PACK 設定" or similar, and contains our textarea
  const textarea = await page.$('textarea[name="ssp_meta_description"]');
  if (!textarea) {
    console.log(`  ❌ ssp_meta_description textarea not found`);
    results.push({ slug, id, status: 'no-textarea' });
    continue;
  }

  // Get current value for backup
  const currentValue = await textarea.inputValue();
  console.log(`  current meta_description: ${currentValue ? currentValue.slice(0, 60) + '...' : '(empty)'}`);

  // Fill
  await textarea.scrollIntoViewIfNeeded();
  await textarea.click();
  await textarea.fill(description);
  console.log(`  filled new description (${description.length} chars)`);

  // Click Update button (block editor)
  const updateBtn = await page.$('.editor-post-publish-button__button, button:has-text("更新"):not([disabled])');
  if (!updateBtn) {
    console.log(`  ❌ Update button not found`);
    results.push({ slug, id, status: 'no-update-btn', old_desc: currentValue });
    continue;
  }
  await updateBtn.click();
  console.log(`  clicked Update`);

  // Wait for save confirmation — block editor shows a snackbar "更新しました"
  try {
    await page.waitForSelector('.components-snackbar__content, .editor-post-saved-state', { timeout: 30000 });
    console.log(`  ✅ saved`);
    results.push({ slug, id, status: 'ok', old_desc: currentValue, new_desc: description });
  } catch (e) {
    console.log(`  ⚠️  no save confirmation (${e.message}) — may still have saved`);
    results.push({ slug, id, status: 'unconfirmed', old_desc: currentValue, new_desc: description });
  }

  await page.waitForTimeout(2500);
}

await fs.writeFile(path.join(BACKUP_DIR, 'meta-desc-results.json'), JSON.stringify({
  timestamp: new Date().toISOString(),
  results,
}, null, 2));
console.log('\nResults saved.');

await page.waitForTimeout(3000);
await browser.close();
