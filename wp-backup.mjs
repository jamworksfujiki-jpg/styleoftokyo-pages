// Backup WordPress pages before SEO/AIO edits.
// Uses saved storage state (wp-storage.json) from wp-login.mjs.
// Saves 2 artifacts per page:
//  - {slug}-public.html   : full rendered public HTML (what visitors see)
//  - {slug}-editor.json   : page object fetched via WP REST API (full post data)
//  - {slug}-meta.json     : title/excerpt/status summary
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');
const PAGES = [
  { slug: 'concept', url: 'https://styleoftokyo.jp/concept/' },
  { slug: 'about', url: 'https://styleoftokyo.jp/about/' },
  { slug: 'service', url: 'https://styleoftokyo.jp/service/' },
];

await fs.mkdir(BACKUP_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE });
const page = await ctx.newPage();

const summary = [];

for (const { slug, url } of PAGES) {
  console.log(`\n=== ${slug} ===`);

  // 1. Fetch public-facing rendered HTML
  await page.goto(url, { waitUntil: 'networkidle' });
  const publicHtml = await page.content();
  await fs.writeFile(path.join(BACKUP_DIR, `${slug}-public.html`), publicHtml);
  console.log(`  saved ${slug}-public.html (${publicHtml.length} bytes)`);

  // 2. Query WP REST API for this page (authenticated cookie from storage)
  const restUrl = `https://styleoftokyo.jp/wp-json/wp/v2/pages?slug=${slug}&context=edit&_embed=true`;
  const restResp = await page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: 'include' });
    return { status: r.status, text: await r.text() };
  }, restUrl);
  await fs.writeFile(path.join(BACKUP_DIR, `${slug}-editor.json`), restResp.text);
  console.log(`  saved ${slug}-editor.json (status=${restResp.status}, ${restResp.text.length} bytes)`);

  // 3. Parse title/status/excerpt/modified for summary
  try {
    const pages = JSON.parse(restResp.text);
    if (Array.isArray(pages) && pages[0]) {
      const p = pages[0];
      const meta = {
        id: p.id,
        slug: p.slug,
        status: p.status,
        title_rendered: p.title?.rendered,
        modified: p.modified,
        link: p.link,
        excerpt_rendered: p.excerpt?.rendered,
        content_length: p.content?.raw?.length || p.content?.rendered?.length || 0,
      };
      summary.push(meta);
      console.log(`  id=${meta.id} status=${meta.status} modified=${meta.modified}`);
    } else {
      console.log(`  WARN: REST returned non-array or empty. First 200 chars:`, restResp.text.slice(0, 200));
    }
  } catch (e) {
    console.log(`  ERROR parsing REST response:`, e.message);
  }
}

await fs.writeFile(path.join(BACKUP_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`\nBackup complete. Files saved to ${BACKUP_DIR}`);

await browser.close();
