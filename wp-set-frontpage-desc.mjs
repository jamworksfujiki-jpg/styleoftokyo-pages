// Set SEO SIMPLE PACK's front-page meta description via admin settings page
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// SEO SIMPLE PACK settings page — slug commonly 'ssp-option-page' or 'ssp-basic-setting'
console.log('[1] Navigate to SEO SIMPLE PACK settings');
await page.goto('https://styleoftokyo.jp/wp-admin/admin.php?page=ssp-option-page', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// Inspect form fields for front-page description
const fields = await page.evaluate(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
  return inputs.map(i => ({
    tag: i.tagName.toLowerCase(),
    id: i.id, name: i.name, value: (i.value || '').slice(0, 80),
    label: i.closest('tr')?.querySelector('th,label')?.textContent?.trim(),
  }));
});
console.log('Fields on settings page:');
for (const f of fields.slice(0, 30)) console.log(`  ${f.tag} name=${f.name} label="${f.label}" value="${f.value}"`);

await page.waitForTimeout(3000);
await browser.close();
