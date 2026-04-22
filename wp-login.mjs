// WP login via Playwright — prompts user to type CAPTCHA manually in headed browser.
// On success, saves storage state to wp-storage.json for reuse.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER = 'styleoftokyo';
const PASS = '6e4A9d9s';
const LOGIN_URL = 'https://styleoftokyo.jp/login_17044';
const STORAGE = path.join(__dirname, 'wp-storage.json');

const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
const ctx = await browser.newContext({ viewport: null });
const page = await ctx.newPage();

console.log('[1/3] Navigating to', LOGIN_URL);
await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

console.log('[2/3] Filling user/pass. Please enter the 4-hiragana CAPTCHA and click LOGIN in the browser window.');
try {
  await page.fill('#user_login', USER);
  await page.fill('#user_pass', PASS);
} catch (e) {
  console.log('Selectors may have changed:', e.message);
}

// Wait up to 3 min for the URL to leave login page
try {
  await page.waitForURL((url) => !String(url).includes('login_17044') && !String(url).includes('wp-login'), { timeout: 180000 });
  console.log('[3/3] Login detected:', page.url());
  await ctx.storageState({ path: STORAGE });
  console.log('Storage saved:', STORAGE);
} catch (e) {
  console.error('Timed out waiting for login. Leaving browser open.');
}

console.log('Keeping browser open for 30s so you can verify. Close manually if needed.');
await page.waitForTimeout(30000);
await browser.close();
