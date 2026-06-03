// Generate zeirishi-banner.png from zeirishi-banner-source.html
// Usage: node assets/generate-banner.mjs

import { chromium } from 'file:///C:/Users/fujik/vscode/spot-egov/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceFile = `file:///${join(__dirname, 'zeirishi-banner-source.html').replace(/\\/g, '/')}`;
const outputFile = join(__dirname, 'zeirishi-banner.png');

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1480, height: 120 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(sourceFile);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

const banner = await page.locator('.banner');
await banner.screenshot({ path: outputFile, omitBackground: true });

await browser.close();
console.log(`✓ Banner saved: ${outputFile}`);
