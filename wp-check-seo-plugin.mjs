// Check which SEO plugin is active on styleoftokyo.jp so we can set custom meta descriptions.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// 1. Plugins list
console.log('[1] Plugins list');
await page.goto('https://styleoftokyo.jp/wp-admin/plugins.php', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const plugins = await page.evaluate(() => {
  const rows = document.querySelectorAll('tr.active, tr.inactive');
  return Array.from(rows).map(tr => ({
    active: tr.classList.contains('active'),
    name: tr.querySelector('.plugin-title strong, .plugin-title b')?.textContent?.trim(),
    slug: tr.getAttribute('data-slug') || tr.getAttribute('data-plugin'),
  })).filter(p => p.name);
});
console.log(`  found ${plugins.length} plugins`);
const seoMatches = plugins.filter(p =>
  /yoast|seo|rank ?math|all.?in.?one|simple.?pack|squirrly/i.test(p.name)
);
console.log('  SEO-related:', JSON.stringify(seoMatches, null, 2));
console.log('  all active:', plugins.filter(p => p.active).map(p => p.name).join(' | '));

// 2. Check CONCEPT edit page for Yoast / SEO SIMPLE PACK metabox
console.log('\n[2] Inspect concept edit page for SEO metabox');
await page.goto('https://styleoftokyo.jp/wp-admin/post.php?post=222&action=edit', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
const seoBoxes = await page.evaluate(() => {
  const selectors = [
    '#yoast-seo-snippet',
    '#wpseo_meta',
    '.yoast-seo-sidebar-panel',
    '#loos-seo-meta-description',
    '#loos-seo-box',
    '#ssp-meta-box',
    '#ssp_metadesc',
    '[id^="yoast"]',
    '[id^="ssp"]',
    '[id^="seo-simple"]',
    '[class*="yoast-seo"]',
    '[class*="seo-metabox"]',
  ];
  const found = [];
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    if (els.length) found.push({ selector: sel, count: els.length });
  }
  // Also look for any element with "description" and "meta" nearby
  const textareas = document.querySelectorAll('textarea');
  const textareaHints = Array.from(textareas).map(ta => ({
    id: ta.id, name: ta.name, placeholder: ta.placeholder, label: ta.closest('div,td,tr')?.querySelector('label')?.textContent,
  })).filter(t => /meta|descr|snippet/i.test(t.id + t.name + t.placeholder + (t.label||'')));
  return { found, textareaHints };
});
console.log('  SEO boxes on edit page:', JSON.stringify(seoBoxes, null, 2));

await browser.close();
