// Search across all WP pages (and TOP/home) for the old text the user quoted.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');

const needles = [
  'タイパ',
  '住宅購入は大きな買い物',
  '楽しく暮らせる形',
  '住宅購入における伴走のプロ',
  '理想とはかけ離れた家づくり',
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://styleoftokyo.jp/wp-admin/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const nonce = await page.evaluate(() => window.wpApiSettings?.nonce);

// Fetch ALL pages via REST
const pages = await page.evaluate(async (nonce) => {
  const all = [];
  for (let p = 1; p <= 5; p++) {
    const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/pages?per_page=100&page=${p}&context=edit`, {
      credentials: 'include', headers: { 'X-WP-Nonce': nonce },
    });
    if (!r.ok) break;
    const arr = await r.json();
    if (!arr.length) break;
    for (const pg of arr) all.push({ id: pg.id, slug: pg.slug, title: pg.title?.raw, content: pg.content?.raw || '' });
  }
  return all;
}, nonce);

console.log(`Total pages: ${pages.length}`);
for (const p of pages) {
  for (const n of needles) {
    if (p.content.includes(n)) {
      const idx = p.content.indexOf(n);
      const snippet = p.content.slice(Math.max(0, idx - 40), idx + n.length + 80);
      console.log(`[HIT] id=${p.id} slug=${p.slug} title="${p.title}" — needle="${n}"`);
      console.log(`      ...${snippet}...`);
    }
  }
}

// Also fetch all posts
const posts = await page.evaluate(async (nonce) => {
  const all = [];
  for (let p = 1; p <= 10; p++) {
    const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/posts?per_page=100&page=${p}&context=edit`, {
      credentials: 'include', headers: { 'X-WP-Nonce': nonce },
    });
    if (!r.ok) break;
    const arr = await r.json();
    if (!arr.length) break;
    for (const pg of arr) all.push({ id: pg.id, slug: pg.slug, title: pg.title?.raw, content: pg.content?.raw || '' });
  }
  return all;
}, nonce);
console.log(`\nTotal posts: ${posts.length}`);
for (const p of posts) {
  for (const n of needles) {
    if (p.content.includes(n)) {
      const idx = p.content.indexOf(n);
      const snippet = p.content.slice(Math.max(0, idx - 40), idx + n.length + 80);
      console.log(`[HIT-post] id=${p.id} slug=${p.slug} title="${p.title}" — needle="${n}"`);
      console.log(`      ...${snippet}...`);
    }
  }
}

// Also Customizer / theme options / widgets — check widgets REST
const widgets = await page.evaluate(async (nonce) => {
  const r = await fetch(`https://styleoftokyo.jp/wp-json/wp/v2/widgets?context=edit`, {
    credentials: 'include', headers: { 'X-WP-Nonce': nonce },
  });
  if (!r.ok) return { status: r.status };
  return await r.json();
}, nonce);
if (Array.isArray(widgets)) {
  console.log(`\nTotal widgets: ${widgets.length}`);
  for (const w of widgets) {
    const raw = JSON.stringify(w);
    for (const n of needles) if (raw.includes(n)) console.log(`[HIT-widget] id=${w.id} needle="${n}"`);
  }
} else {
  console.log('\nwidgets:', widgets);
}

await browser.close();
