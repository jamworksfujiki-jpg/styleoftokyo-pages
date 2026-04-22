// Probe: confirm admin access + extract page IDs + get edit-view raw content.
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'wp-storage.json');
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState: STORAGE, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

console.log('[1] Open wp-admin pages list');
await page.goto('https://styleoftokyo.jp/wp-admin/edit.php?post_type=page', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

// Capture user role / permissions
const userInfo = await page.evaluate(() => {
  const adminBar = document.querySelector('#wp-admin-bar-my-account');
  return {
    url: location.href,
    title: document.title,
    greet: document.querySelector('#wp-admin-bar-my-account .display-name')?.textContent,
    body_class: document.body?.className,
    has_edit_posts_menu: !!document.querySelector('#menu-pages'),
  };
});
console.log('User info:', JSON.stringify(userInfo, null, 2));

// Extract page IDs for concept / about / service
const pageRows = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('tr[id^="post-"]'));
  return rows.map(tr => {
    const id = tr.id.replace('post-', '');
    const titleEl = tr.querySelector('.row-title');
    const editLink = tr.querySelector('.row-actions .edit a')?.href;
    const viewLink = tr.querySelector('.row-actions .view a')?.href;
    return { id, title: titleEl?.textContent?.trim(), edit: editLink, view: viewLink };
  });
});
console.log(`Found ${pageRows.length} pages in list.`);
await fs.writeFile(path.join(BACKUP_DIR, 'admin-pages-list.json'), JSON.stringify(pageRows, null, 2));

const targets = ['concept', 'about', 'service'];
const matches = {};
for (const slug of targets) {
  const match = pageRows.find(p => p.view?.includes(`/${slug}/`) || p.edit?.includes(`post=`) && p.view?.includes(`${slug}`));
  if (match) matches[slug] = match;
}
console.log('Slug matches:', JSON.stringify(matches, null, 2));

await fs.writeFile(path.join(BACKUP_DIR, 'admin-page-matches.json'), JSON.stringify(matches, null, 2));
console.log('Saved admin-pages-list.json and admin-page-matches.json');

await page.waitForTimeout(3000);
await browser.close();
