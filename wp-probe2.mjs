// Paginate all admin pages + check URL existence for /about/ /service/.
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// Fetch all pages via REST (public, no edit context)
console.log('Fetching all pages via public REST...');
const all = [];
let pageNo = 1;
while (true) {
  const resp = await page.evaluate(async (url) => {
    const r = await fetch(url);
    const text = await r.text();
    return { status: r.status, text, headers: { total: r.headers.get('x-wp-total'), totalPages: r.headers.get('x-wp-totalpages') } };
  }, `https://styleoftokyo.jp/wp-json/wp/v2/pages?per_page=100&page=${pageNo}`);
  if (resp.status !== 200) {
    console.log('  stopped at page', pageNo, 'status', resp.status);
    break;
  }
  const arr = JSON.parse(resp.text);
  if (!arr.length) break;
  all.push(...arr);
  console.log(`  page ${pageNo}: +${arr.length} (total ${resp.headers.total})`);
  if (pageNo >= parseInt(resp.headers.totalPages)) break;
  pageNo++;
}

const slugsOfInterest = ['concept', 'about', 'service'];
const found = {};
for (const slug of slugsOfInterest) {
  const m = all.find(p => p.slug === slug || p.link?.endsWith(`/${slug}/`));
  if (m) {
    found[slug] = { id: m.id, slug: m.slug, title: m.title?.rendered, link: m.link, status: m.status, modified: m.modified };
  }
}
console.log('\nSlug matches via REST:\n', JSON.stringify(found, null, 2));
await fs.writeFile(path.join(BACKUP_DIR, 'target-page-ids.json'), JSON.stringify(found, null, 2));

// Also list all slugs for reference
const slugSummary = all.map(p => ({ id: p.id, slug: p.slug, title: p.title?.rendered, link: p.link })).sort((a,b)=>a.slug.localeCompare(b.slug));
await fs.writeFile(path.join(BACKUP_DIR, 'all-page-slugs.json'), JSON.stringify(slugSummary, null, 2));
console.log('Saved target-page-ids.json + all-page-slugs.json. Total pages:', all.length);

await browser.close();
