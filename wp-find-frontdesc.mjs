// Inspect SEO SIMPLE PACK main setting page for front-page description field
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/admin.php?page=ssp_main_setting', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const dump = await page.evaluate(() => {
  const out = [];
  const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
  for (const i of inputs) {
    const row = i.closest('tr');
    const label = row?.querySelector('th,label')?.textContent?.trim() || '';
    const section = i.closest('.ssp-setting-section, .ssp-section')?.querySelector('h2,h3')?.textContent?.trim() || '';
    out.push({
      tag: i.tagName.toLowerCase(),
      name: i.name,
      id: i.id,
      value: (i.value || '').slice(0, 100),
      label: label.slice(0, 60),
      section,
    });
  }
  // Also grab tab names
  const tabs = Array.from(document.querySelectorAll('.nav-tab, .ssp-tabs a')).map(a => a.textContent.trim());
  return { fields: out, tabs };
});

console.log('Tabs:', dump.tabs.join(' | '));
console.log('\nFields:');
for (const f of dump.fields) {
  console.log(`  [${f.tag}] name="${f.name}" label="${f.label}" value="${f.value}"`);
}

await browser.close();
