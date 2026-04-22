// Verify meta description now appears on public URLs.
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();

const urls = [
  'https://styleoftokyo.jp/',
  'https://styleoftokyo.jp/concept/',
  'https://styleoftokyo.jp/about/',
  'https://styleoftokyo.jp/service/',
];

for (const u of urls) {
  await page.goto(u, { waitUntil: 'domcontentloaded' });
  const desc = await page.getAttribute('meta[name="description"]', 'content');
  const ogdesc = await page.getAttribute('meta[property="og:description"]', 'content');
  console.log(`\n${u}`);
  console.log(`  description: ${desc?.slice(0, 120)}`);
  console.log(`  og:desc:     ${ogdesc?.slice(0, 120)}`);
}

await browser.close();
