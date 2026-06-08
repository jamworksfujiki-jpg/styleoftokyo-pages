// Generate concept-banner.png and partners-banner.png
// Usage: node assets/generate-banners.mjs

import { chromium } from 'file:///C:/Users/fujik/vscode/spot-egov/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const banners = [
  { src: 'concept-banner-source.html', out: 'concept-banner.png' },
  { src: 'partners-banner-source.html', out: 'partners-banner.png' },
];

const browser = await chromium.launch();

for (const b of banners) {
  const sourceFile = `file:///${join(__dirname, b.src).replace(/\\/g, '/')}`;
  const outputFile = join(__dirname, b.out);

  const context = await browser.newContext({
    viewport: { width: 1480, height: 160 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await page.goto(sourceFile);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const banner = await page.locator('.banner');
  await banner.screenshot({ path: outputFile, omitBackground: true });
  await context.close();

  console.log(`✓ Banner saved: ${outputFile}`);
}

await browser.close();
