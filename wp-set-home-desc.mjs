// Update SEO SIMPLE PACK front-page (home) meta description.
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const NEW_DESC = 'スタイルオブ東京は、不動産の購入・売却・住み替え・相続・空き家・建築リフォームまで、あらゆる不動産のお悩みに中立の立場で対応する東京の不動産エージェント会社です。Zoom無料相談受付中。';

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

console.log('[1] Open SEO SIMPLE PACK 基本設定');
await page.goto('https://styleoftokyo.jp/wp-admin/admin.php?page=ssp_main_setting', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// Capture old value for rollback
const oldValue = await page.inputValue('textarea[name="home_desc"]');
console.log(`   old home_desc: "${oldValue}"`);
await fs.writeFile(path.join(BACKUP_DIR, 'ssp-home-desc-before.txt'), oldValue);

console.log('[2] Fill new description');
const ta = page.locator('textarea[name="home_desc"]');
await ta.scrollIntoViewIfNeeded();
await ta.click();
await ta.fill(NEW_DESC);
console.log(`   new home_desc length=${NEW_DESC.length}`);

console.log('[3] Click Save');
// SEO SIMPLE PACK save button: input[type=submit].button-primary with name="submit"
const saveBtn = page.locator('button.button-primary[type="submit"]:has-text("設定を保存する")').first();
await saveBtn.scrollIntoViewIfNeeded();
await saveBtn.click();
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2500);

// Read back to confirm
const after = await page.inputValue('textarea[name="home_desc"]');
console.log(`[4] after save: "${after.slice(0, 80)}..."`);
if (after === NEW_DESC) console.log('   ✅ saved correctly');
else console.log('   ⚠️ mismatch');

await fs.writeFile(path.join(BACKUP_DIR, 'ssp-home-desc-after.txt'), after);

await page.waitForTimeout(1500);
await browser.close();
